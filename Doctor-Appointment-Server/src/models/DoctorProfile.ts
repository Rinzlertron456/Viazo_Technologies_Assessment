import mongoose, { Document, Schema } from "mongoose";

export interface IDoctorProfile extends Document {
  userId: mongoose.Types.ObjectId;
  specialization: string;
  qualification: string;
  experience: number;
  registrationNumber: string;
  consultationFee: number;
  languages: string[];
  clinicAddress: string;
  clinicCity: string;
  bio?: string;
  isVerified: boolean;
  verificationStatus: "pending" | "approved" | "rejected";
}

const doctorProfileSchema = new Schema<IDoctorProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    specialization: { type: String, default: "" },
    qualification: { type: String, default: "" },
    experience: { type: Number, required: true, min: 0, default: 0 },
    registrationNumber: { type: String, default: "" },
    consultationFee: { type: Number, required: true, min: 0, default: 0 },
    languages: [{ type: String }],
    clinicAddress: { type: String, default: "" },
    clinicCity: { type: String, default: "" },
    bio: { type: String },
    isVerified: { type: Boolean, default: false },
    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true },
);

export const DoctorProfile = mongoose.model<IDoctorProfile>(
  "DoctorProfile",
  doctorProfileSchema,
);
