import mongoose, { Document, Schema } from "mongoose";

export interface IBill extends Document {
  appointmentId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  consultationFee: number;
  discount: number;
  tax: number;
  totalAmount: number;
  paymentMethod?: string;
  paymentStatus: "Pending" | "Paid" | "Refunded";
  invoiceNumber: string;
  paidAt?: Date;
}

const billSchema = new Schema<IBill>(
  {
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
    },
    patientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    consultationFee: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Refunded"],
      default: "Pending",
    },
    invoiceNumber: { type: String, required: true, unique: true },
    paidAt: { type: Date },
  },
  { timestamps: true },
);

billSchema.index({ appointmentId: 1 });
billSchema.index({ patientId: 1 });

export const Bill = mongoose.model<IBill>("Bill", billSchema);
