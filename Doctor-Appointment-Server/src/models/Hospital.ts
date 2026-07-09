import mongoose, { Document, Schema } from "mongoose";

export interface IHospital extends Document {
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  isActive: boolean;
}

const hospitalSchema = new Schema<IHospital>(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Hospital = mongoose.model<IHospital>("Hospital", hospitalSchema);
