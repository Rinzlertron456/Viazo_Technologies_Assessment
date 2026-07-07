import mongoose, { Document, Schema } from 'mongoose';

export interface ISlot extends Document {
  doctorId: mongoose.Types.ObjectId;
  date: Date;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  maxPatients: number;
  currentBookings: number;
}

const slotSchema = new Schema<ISlot>(
  {
    doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    isBooked: { type: Boolean, default: false },
    maxPatients: { type: Number, default: 1 },
    currentBookings: { type: Number, default: 0 },
  },
  { timestamps: true }
);

slotSchema.index({ doctorId: 1, date: 1 });

export const Slot = mongoose.model<ISlot>('Slot', slotSchema);
