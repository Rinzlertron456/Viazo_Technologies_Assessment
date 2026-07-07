import mongoose, { Document, Schema } from 'mongoose';

export interface IPatientProfile extends Document {
  userId: mongoose.Types.ObjectId;
  dateOfBirth?: Date;
  gender?: 'Male' | 'Female' | 'Other';
  bloodGroup?: string;
  height?: number;
  weight?: number;
  allergies: string[];
  chronicDiseases: string[];
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
}

const patientProfileSchema = new Schema<IPatientProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    bloodGroup: { type: String },
    height: { type: Number },
    weight: { type: Number },
    allergies: [{ type: String }],
    chronicDiseases: [{ type: String }],
    emergencyContactName: { type: String },
    emergencyContactPhone: { type: String },
    insuranceProvider: { type: String },
    insurancePolicyNumber: { type: String },
  },
  { timestamps: true }
);

export const PatientProfile = mongoose.model<IPatientProfile>('PatientProfile', patientProfileSchema);
