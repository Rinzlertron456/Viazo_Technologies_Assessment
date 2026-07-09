import { Request, Response, NextFunction } from "express";
import { User } from "../models/User";
import { Appointment } from "../models/Appointment";
import { Bill } from "../models/Bill";
import { Hospital } from "../models/Hospital";
import { UnauthorizedError, NotFoundError } from "../utils/errors";

export async function getHospitals(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");
    const hospitals = await Hospital.find({}).sort({ name: 1 }).lean();
    res.json({ success: true, data: { hospitals } });
  } catch (error) {
    next(error);
  }
}

export async function createHospital(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");
    const { name, address, city, phone, email } = req.body;
    if (!name || !city) {
      res.status(400).json({ success: false, message: "Name and city are required" });
      return;
    }
    const hospital = await Hospital.create({ name, address, city, phone, email });
    res.status(201).json({ success: true, message: "Hospital created", data: { hospital } });
  } catch (error) {
    next(error);
  }
}

export async function updateHospital(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");
    const { id } = req.params;
    const { name, address, city, phone, email, isActive } = req.body;
    const hospital = await Hospital.findByIdAndUpdate(
      id,
      { name, address, city, phone, email, isActive },
      { new: true },
    );
    if (!hospital) throw new NotFoundError("Hospital not found");
    res.json({ success: true, data: { hospital } });
  } catch (error) {
    next(error);
  }
}

export async function getAllUsers(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");
    const page = parseInt(String(req.query.page || "1"), 10);
    const limit = parseInt(String(req.query.limit || "50"), 10);
    const skip = (page - 1) * limit;
    const role = req.query.role as string | undefined;

    const match: Record<string, unknown> = {};
    if (role) match.role = role;

    const [users, total] = await Promise.all([
      User.find(match).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(match),
    ]);

    res.json({
      success: true,
      data: { users, total, page, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
}

export async function deactivateUser(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError("User not found");
    user.isActive = !user.isActive;
    await user.save();
    res.json({
      success: true,
      message: `User ${user.isActive ? "activated" : "deactivated"}`,
    });
  } catch (error) {
    next(error);
  }
}

export async function getSystemStats(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");
    const [
      totalUsers,
      totalDoctors,
      totalPatients,
      totalAppointments,
      totalBills,
      totalRevenue,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: "Doctor" }),
      User.countDocuments({ role: "Patient" }),
      Appointment.countDocuments({}),
      Bill.countDocuments({}),
      Bill.aggregate([
        { $match: { paymentStatus: "Paid" } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalDoctors,
          totalPatients,
          totalAppointments,
          totalBills,
          totalRevenue: totalRevenue[0]?.total || 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}
