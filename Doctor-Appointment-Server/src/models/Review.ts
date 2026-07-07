import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
  appointmentId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  reply?: string;
}

const reviewSchema = new Schema<IReview>(
  {
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment', required: true, unique: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    reply: { type: String },
  },
  { timestamps: true }
);

reviewSchema.index({ doctorId: 1, createdAt: -1 });

export const Review = mongoose.model<IReview>('Review', reviewSchema);
