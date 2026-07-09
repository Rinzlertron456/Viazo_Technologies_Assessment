import mongoose, { Document, Schema } from 'mongoose';

export interface IMedicine {
  name: string;
  dose: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface IPrescription extends Document {
  appointmentId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  symptoms: string[];
  diagnosis: string[];
  observations?: string;
  medicines: IMedicine[];
  labTests?: string[];
  advice?: string;
  followUpDate?: Date;
}

const medicineSchema = new Schema<IMedicine>({
  name: { type: String, required: true },
  dose: { type: String, required: true },
  frequency: { type: String, required: true },
  duration: { type: String, required: true },
  instructions: { type: String },
}, { _id: false });

const prescriptionSchema = new Schema<IPrescription>(
  {
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment', required: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    symptoms: [{ type: String }],
    diagnosis: [{ type: String }],
    observations: { type: String },
    medicines: [medicineSchema],
    labTests: [{ type: String }],
    advice: { type: String },
    followUpDate: { type: Date },
  },
  { timestamps: true }
);

prescriptionSchema.index({ appointmentId: 1 });
prescriptionSchema.index({ patientId: 1 });
prescriptionSchema.index({ doctorId: 1 });

export const Prescription = mongoose.model<IPrescription>('Prescription', prescriptionSchema);
