import mongoose, { Document, Schema } from "mongoose";

export interface IPharmacy extends Document {
  name: string;
  address: string;
  phone: string;
  licenseNumber: string;
  isActive: boolean;
}

const pharmacySchema = new Schema<IPharmacy>(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    licenseNumber: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Pharmacy = mongoose.model<IPharmacy>("Pharmacy", pharmacySchema);
