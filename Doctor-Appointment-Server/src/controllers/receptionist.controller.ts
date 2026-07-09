import { Request, Response, NextFunction } from "express";
import { Appointment } from "../models/Appointment";
import { Bill } from "../models/Bill";
import { User } from "../models/User";
import { NotFoundError, UnauthorizedError } from "../utils/errors";

export async function getReceptionistPatients(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");
    const { search } = req.query;

    const match: Record<string, unknown> = { role: "Patient" };
    if (search) {
      const q = String(search).trim();
      match.$or = [
        { firstName: { $regex: q, $options: "i" } },
        { lastName: { $regex: q, $options: "i" } },
        { customId: { $regex: q, $options: "i" } },
      ];
    }

    const patients = await User.find(match, "firstName lastName customId")
      .sort({ firstName: 1, lastName: 1 })
      .limit(100)
      .lean();

    res.json({ success: true, data: { patients } });
  } catch (error) {
    next(error);
  }
}

export async function getReceptionistAppointments(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");
    const { period, status } = req.query;

    const match: Record<string, unknown> = {};
    if (period !== "all") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      match.date = { $gte: today, $lt: tomorrow };
    }
    if (status) {
      const list = String(status)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (list.length) match.status = { $in: list };
    }

    const appointments = await Appointment.find(match)
      .populate("patientId", "firstName lastName customId")
      .populate("doctorId", "firstName lastName")
      .sort({ date: -1, startTime: -1 })
      .limit(100)
      .lean();

    const data = appointments.map((a: any) => ({
      _id: a._id,
      patientName: a.patientId
        ? `${a.patientId.firstName} ${a.patientId.lastName}`
        : "Unknown",
      patientCustomId: a.patientId?.customId || "",
      doctorName: a.doctorId
        ? `Dr. ${a.doctorId.firstName} ${a.doctorId.lastName}`
        : "",
      date: a.date,
      startTime: a.startTime,
      status: a.status,
      totalAmount: a.totalAmount,
    }));

    res.json({ success: true, data: { appointments: data } });
  } catch (error) {
    next(error);
  }
}

export async function getTodayQueue(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");
    const { status, period } = req.query;

    const match: Record<string, unknown> = {};

    // Default: today only. ?period=all shows every date.
    if (period !== "all") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      match.date = { $gte: today, $lt: tomorrow };
    }

    // ?status=Pending,Cancelled etc. When no status is given, the default
    // "today" view still limits to active statuses so the live queue stays clean.
    if (status) {
      const list = String(status)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (list.length) match.status = { $in: list };
    } else if (period !== "all") {
      match.status = {
        $in: ["Confirmed", "CheckedIn", "InProgress", "Pending"],
      };
    }

    const appointments = await Appointment.find(match)
      .populate("patientId", "firstName lastName phone")
      .populate("doctorId", "firstName lastName")
      .sort({ date: 1, startTime: 1 })
      .lean();

    res.json({ success: true, data: { queue: appointments } });
  } catch (error) {
    next(error);
  }
}

export async function walkInRegistration(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");
    const { patientId, doctorId, reason } = req.body;

    const now = new Date();
    const appointment = await Appointment.create({
      patientId,
      doctorId,
      date: now,
      startTime: now.toTimeString().slice(0, 5),
      endTime: new Date(now.getTime() + 30 * 60000).toTimeString().slice(0, 5),
      type: "Clinic",
      status: "CheckedIn",
      reason,
      createdBy: req.user.userId,
    });

    const populated = await Appointment.findById(appointment._id)
      .populate("patientId", "firstName lastName")
      .populate("doctorId", "firstName lastName");

    res
      .status(201)
      .json({
        success: true,
        message: "Walk-in registered",
        data: { appointment: populated },
      });
  } catch (error) {
    next(error);
  }
}

export async function checkInPatient(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");
    const { id } = req.params;

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      { status: "CheckedIn" },
      { new: true },
    ).populate("patientId", "firstName lastName");

    if (!appointment) throw new NotFoundError("Appointment not found");

    res.json({
      success: true,
      message: "Patient checked in",
      data: { appointment },
    });
  } catch (error) {
    next(error);
  }
}

export async function createBill(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");
    const { appointmentId, consultationFee, discount, tax, paymentMethod } =
      req.body;
    const totalAmount = (consultationFee || 0) - (discount || 0) + (tax || 0);

    const invNum = `INV-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const bill = await Bill.create({
      appointmentId,
      patientId: req.body.patientId,
      consultationFee: consultationFee || 0,
      discount: discount || 0,
      tax: tax || 0,
      totalAmount,
      paymentMethod,
      invoiceNumber: invNum,
    });

    if (paymentMethod) {
      bill.paymentStatus = "Paid";
      bill.paidAt = new Date();
      await bill.save();
    }

    res
      .status(201)
      .json({ success: true, message: "Bill created", data: { bill } });
  } catch (error) {
    next(error);
  }
}
