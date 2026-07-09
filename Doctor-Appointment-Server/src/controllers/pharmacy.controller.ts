import { Request, Response, NextFunction } from "express";
import { Pharmacy } from "../models/Pharmacy";
import { NotFoundError, UnauthorizedError } from "../utils/errors";
import { pick, PHARMACY_FIELDS } from "../middleware/validate";

export async function listPharmacies(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");
    const pharmacies = await Pharmacy.find({ isActive: true })
      .sort({ name: 1 })
      .lean();
    res.json({ success: true, data: { pharmacies } });
  } catch (error) {
    next(error);
  }
}

export async function createPharmacy(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");
    const safeData = pick(req.body, PHARMACY_FIELDS as unknown as (keyof typeof req.body)[]);
    const pharmacy = await Pharmacy.create(safeData);
    res
      .status(201)
      .json({ success: true, message: "Pharmacy created", data: { pharmacy } });
  } catch (error) {
    next(error);
  }
}

export async function updatePharmacy(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");
    const { id } = req.params;
    const safeData = pick(req.body, PHARMACY_FIELDS as unknown as (keyof typeof req.body)[]);
    const pharmacy = await Pharmacy.findByIdAndUpdate(id, safeData, {
      new: true,
    });
    if (!pharmacy) throw new NotFoundError("Pharmacy not found");
    res.json({ success: true, data: { pharmacy } });
  } catch (error) {
    next(error);
  }
}

export async function deletePharmacy(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");
    const { id } = req.params;
    const pharmacy = await Pharmacy.findByIdAndDelete(id);
    if (!pharmacy) throw new NotFoundError("Pharmacy not found");
    res.json({ success: true, message: "Pharmacy deleted" });
  } catch (error) {
    next(error);
  }
}
