import { Request, Response, NextFunction } from "express";
import { DoctorProfile } from "../models/DoctorProfile";
import { NotFoundError, UnauthorizedError } from "../utils/errors";

export async function getPendingVerifications(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");
    const doctors = await DoctorProfile.find({
      $or: [
        { verificationStatus: "pending" },
        { verificationStatus: { $exists: false }, isVerified: false },
      ],
    })
      .populate("userId", "firstName lastName email phone")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: { doctors } });
  } catch (error) {
    next(error);
  }
}

export async function approveLicense(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");
    const { doctorId } = req.params;
    const profile = await DoctorProfile.findOneAndUpdate(
      { _id: doctorId },
      { isVerified: true, verificationStatus: "approved" },
      { new: true },
    );
    if (!profile) throw new NotFoundError("Doctor profile not found");
    res.json({ success: true, message: "License approved", data: { profile } });
  } catch (error) {
    next(error);
  }
}

export async function rejectLicense(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");
    const { doctorId } = req.params;
    const { reason } = req.body;
    const profile = await DoctorProfile.findOneAndUpdate(
      { _id: doctorId },
      { isVerified: false, verificationStatus: "rejected" },
      { new: true },
    );
    if (!profile) throw new NotFoundError("Doctor profile not found");
    res.json({
      success: true,
      message: `License rejected: ${reason || "No reason provided"}`,
      data: { profile },
    });
  } catch (error) {
    next(error);
  }
}
