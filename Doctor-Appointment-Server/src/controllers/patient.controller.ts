import { Request, Response, NextFunction } from "express";
import { User } from "../models/User";
import { DoctorProfile } from "../models/DoctorProfile";
import { PatientProfile } from "../models/PatientProfile";
import { Appointment } from "../models/Appointment";
import { Prescription } from "../models/Prescription";
import { Slot } from "../models/Slot";
import { NotFoundError, UnauthorizedError } from "../utils/errors";
import { parseLocalDate } from "../utils/date";

export async function searchDoctors(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { specialty, name, city, page = "1", limit = "10" } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const match: Record<string, unknown> = { role: "Doctor", isActive: true };
    if (name) {
      match.$or = [
        { firstName: { $regex: name, $options: "i" } },
        { lastName: { $regex: name, $options: "i" } },
      ];
    }

    const doctors = await User.find(
      match,
      "firstName lastName email phone profilePicture",
    )
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    const doctorIds = doctors.map((d) => d._id);
    const profiles = await DoctorProfile.find({
      userId: { $in: doctorIds },
    }).lean();
    const profileMap = new Map(profiles.map((p) => [p.userId.toString(), p]));

    const result = doctors
      .map((d) => ({
        _id: d._id,
        firstName: d.firstName,
        lastName: d.lastName,
        email: d.email,
        phone: d.phone,
        profilePicture: d.profilePicture,
        profile: profileMap.get(d._id.toString()) || null,
      }))
      .filter((r) => r.profile !== null);

    let filtered = result;
    if (specialty) {
      filtered = filtered.filter((r) =>
        r
          .profile!.specialization.toLowerCase()
          .includes((specialty as string).toLowerCase()),
      );
    }
    if (city) {
      filtered = filtered.filter((r) =>
        r
          .profile!.clinicCity.toLowerCase()
          .includes((city as string).toLowerCase()),
      );
    }

    res.json({
      success: true,
      data: { doctors: filtered, total: filtered.length },
    });
  } catch (error) {
    next(error);
  }
}

export async function getDoctorProfile(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { doctorId } = req.params;

    const user = await User.findById(doctorId).lean();
    if (!user || user.role !== "Doctor") {
      throw new NotFoundError("Doctor not found");
    }

    const profile = await DoctorProfile.findOne({ userId: doctorId }).lean();
    const now = new Date();
    const slots = await Slot.find({
      doctorId,
      isBooked: false,
      $or: [
        { date: { $gt: now } },
        {
          date: { $eq: now },
          startTime: {
            $gte: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
          },
        },
      ],
    })
      .sort({ date: 1, startTime: 1 })
      .limit(20)
      .lean();

    res.json({
      success: true,
      data: {
        doctor: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          profilePicture: user.profilePicture,
        },
        profile,
        availableSlots: slots,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function bookAppointment(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");

    const { doctorId, date, startTime, endTime, type, reason, notes } =
      req.body;

    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== "Doctor")
      throw new NotFoundError("Doctor not found");

    const doctorProfile = await DoctorProfile.findOne({ userId: doctorId });
    const fee = doctorProfile?.consultationFee || 0;

    const appointment = await Appointment.create({
      patientId: req.user.userId,
      doctorId,
      date: parseLocalDate(date),
      startTime,
      endTime,
      type: type || "Clinic",
      reason,
      notes,
      amount: fee,
      totalAmount: fee,
      createdBy: req.user.userId,
    });

    const populated = await Appointment.findById(appointment._id)
      .populate("doctorId", "firstName lastName")
      .populate("patientId", "firstName lastName");

    res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      data: { appointment: populated },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyAppointments(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");

    const { status, page = "1", limit = "10" } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const match: Record<string, unknown> = { patientId: req.user.userId };
    if (status) match.status = status;

    const appointments = await Appointment.find(match)
      .populate("doctorId", "firstName lastName email")
      .sort({ date: -1, startTime: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    const total = await Appointment.countDocuments(match);

    res.json({ success: true, data: { appointments, total } });
  } catch (error) {
    next(error);
  }
}

export async function cancelAppointment(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");

    const { id } = req.params;
    const appointment = await Appointment.findOne({
      _id: id,
      patientId: req.user.userId,
    });
    if (!appointment) throw new NotFoundError("Appointment not found");
    if (appointment.status === "Completed") {
      res.status(400).json({
        success: false,
        message: "Cannot cancel a completed appointment",
      });
      return;
    }

    appointment.status = "Cancelled";
    await appointment.save();

    if (appointment.slotId) {
      await Slot.findByIdAndUpdate(appointment.slotId, {
        isBooked: false,
        currentBookings: 0,
      });
    }

    res.json({ success: true, message: "Appointment cancelled successfully" });
  } catch (error) {
    next(error);
  }
}

export async function rescheduleAppointment(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");

    const { id } = req.params;
    const { date, startTime, endTime } = req.body;

    const appointment = await Appointment.findOne({
      _id: id,
      patientId: req.user.userId,
    });
    if (!appointment) throw new NotFoundError("Appointment not found");
    if (appointment.status === "Completed") {
      res.status(400).json({
        success: false,
        message: "Cannot reschedule a completed appointment",
      });
      return;
    }

    appointment.date = parseLocalDate(date);
    appointment.startTime = startTime;
    appointment.endTime = endTime;
    appointment.status = "Rescheduled";
    await appointment.save();

    res.json({
      success: true,
      message: "Appointment rescheduled successfully",
      data: { appointment },
    });
  } catch (error) {
    next(error);
  }
}

export async function getPatientProfile(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");
    const user = await User.findById(req.user.userId).lean();
    if (!user) throw new NotFoundError("User not found");

    res.json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
}

export async function updatePatientProfile(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");

    const allowed = ["firstName", "lastName", "phone"];
    const updates: Record<string, string> = {};
    for (const field of allowed) {
      if (req.body[field]) updates[field] = req.body[field];
    }

    const user = await User.findByIdAndUpdate(req.user.userId, updates, {
      new: true,
    }).lean();
    res.json({ success: true, message: "Profile updated", data: { user } });
  } catch (error) {
    next(error);
  }
}

export async function getExtendedProfile(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");

    let profile = await PatientProfile.findOne({
      userId: req.user.userId,
    }).lean();
    if (!profile) {
      profile = await PatientProfile.create({ userId: req.user.userId });
    }

    res.json({ success: true, data: { profile } });
  } catch (error) {
    next(error);
  }
}

export async function updateMedicalProfile(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");

    const allowed = [
      "dateOfBirth",
      "gender",
      "bloodGroup",
      "height",
      "weight",
      "allergies",
      "chronicDiseases",
      "emergencyContactName",
      "emergencyContactPhone",
      "insuranceProvider",
      "insurancePolicyNumber",
    ];
    const updates: Record<string, unknown> = {};
    for (const field of allowed) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const profile = await PatientProfile.findOneAndUpdate(
      { userId: req.user.userId },
      { $set: updates },
      { upsert: true, new: true },
    ).lean();

    res.json({
      success: true,
      message: "Medical profile updated",
      data: { profile },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMedicalRecords(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");

    const appointments = await Appointment.find({
      patientId: req.user.userId,
      status: { $in: ["Completed", "InProgress"] },
    })
      .populate("doctorId", "firstName lastName")
      .sort({ date: -1 })
      .limit(20)
      .lean();

    const appointmentIds = appointments.map((a) => a._id);
    const prescriptions = await Prescription.find({
      appointmentId: { $in: appointmentIds },
    })
      .populate("doctorId", "firstName lastName")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: {
        appointments,
        prescriptions,
      },
    });
  } catch (error) {
    next(error);
  }
}
