import { Request, Response, NextFunction } from "express";
import { User } from "../models/User";
import { DoctorProfile } from "../models/DoctorProfile";
import { Appointment } from "../models/Appointment";
import { NotFoundError, UnauthorizedError } from "../utils/errors";

export async function getAllDoctors(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");
    const doctors = await User.find(
      { role: "Doctor" },
      "firstName lastName email phone isActive",
    )
      .sort({ firstName: 1 })
      .lean();

    const userIds = doctors.map((d) => d._id);
    const profiles = await DoctorProfile.find({
      userId: { $in: userIds },
    }).lean();
    const profileMap = new Map(profiles.map((p) => [p.userId.toString(), p]));

    const result = doctors.map((d) => ({
      ...d,
      profile: profileMap.get(d._id.toString()) || null,
    }));

    res.json({ success: true, data: { doctors: result } });
  } catch (error) {
    next(error);
  }
}

export async function addDoctor(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");

    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      specialization,
      qualification,
      experience,
      registrationNumber,
      consultationFee,
      clinicAddress,
      clinicCity,
    } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      res.status(409).json({ success: false, message: "Email already in use" });
      return;
    }

    const parsedExperience =
      experience === "" || experience == null ? 0 : Number(experience);
    const parsedConsultationFee =
      consultationFee === "" || consultationFee == null
        ? 0
        : Number(consultationFee);

    const createdUser = await User.create({
      email,
      password,
      firstName,
      lastName,
      phone,
      role: "Doctor",
    });

    try {
      await DoctorProfile.create({
        userId: createdUser._id,
        specialization: specialization || "",
        qualification: qualification || "",
        experience: Number.isFinite(parsedExperience) ? parsedExperience : 0,
        registrationNumber: registrationNumber || "",
        consultationFee: Number.isFinite(parsedConsultationFee)
          ? parsedConsultationFee
          : 0,
        clinicAddress: clinicAddress || "",
        clinicCity: clinicCity || "",
      });

      res
        .status(201)
        .json({ success: true, message: "Doctor added successfully" });
    } catch (error) {
      await User.findByIdAndDelete(createdUser._id);
      throw error;
    }
  } catch (error) {
    next(error);
  }
}

export async function toggleDoctorStatus(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");
    const { doctorId } = req.params;
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== "Doctor")
      throw new NotFoundError("Doctor not found");

    doctor.isActive = !doctor.isActive;
    await doctor.save();
    res.json({
      success: true,
      message: `Doctor ${doctor.isActive ? "activated" : "deactivated"}`,
      data: { isActive: doctor.isActive },
    });
  } catch (error) {
    next(error);
  }
}

export async function getAllPatients(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");
    const { search, page = "1", limit = "20" } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const match: Record<string, unknown> = { role: "Patient" };
    if (search) {
      match.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const patients = await User.find(
      match,
      "firstName lastName email phone isActive",
    )
      .sort({ firstName: 1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    const total = await User.countDocuments(match);
    res.json({ success: true, data: { patients, total } });
  } catch (error) {
    next(error);
  }
}

export async function getAllAppointments(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");
    const { status, date, page = "1", limit = "20" } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const match: Record<string, unknown> = {};
    if (status) match.status = status;
    if (date) {
      const d = new Date(date as string);
      const nextD = new Date(d);
      nextD.setDate(nextD.getDate() + 1);
      match.date = { $gte: d, $lt: nextD };
    }

    const appointments = await Appointment.find(match)
      .populate("patientId", "firstName lastName email phone")
      .populate("doctorId", "firstName lastName")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    const total = await Appointment.countDocuments(match);
    res.json({ success: true, data: { appointments, total } });
  } catch (error) {
    next(error);
  }
}
