import mongoose, { Document, Schema } from 'mongoose';

export type AppointmentStatus = 'Pending' | 'Confirmed' | 'CheckedIn' | 'InProgress' | 'Completed' | 'Cancelled' | 'Rescheduled' | 'NoShow';
export type AppointmentType = 'Clinic' | 'Video' | 'Phone' | 'Home';

export interface IAppointment extends Document {
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  slotId?: mongoose.Types.ObjectId;
  date: Date;
  startTime: string;
  endTime: string;
  type: AppointmentType;
  status: AppointmentStatus;
  reason: string;
  notes?: string;
  amount: number;
  discount: number;
  tax: number;
  totalAmount: number;
  paymentStatus: 'Pending' | 'Paid' | 'Refunded';
  paymentMethod?: string;
  createdBy: mongoose.Types.ObjectId;
}

const appointmentSchema = new Schema<IAppointment>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    slotId: { type: Schema.Types.ObjectId, ref: 'Slot' },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    type: {
      type: String,
      enum: ['Clinic', 'Video', 'Phone', 'Home'],
      default: 'Clinic',
    },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'CheckedIn', 'InProgress', 'Completed', 'Cancelled', 'Rescheduled', 'NoShow'],
      default: 'Pending',
    },
    reason: { type: String, required: true },
    notes: { type: String },
    amount: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Refunded'],
      default: 'Pending',
    },
    paymentMethod: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

appointmentSchema.index({ patientId: 1, date: -1 });
appointmentSchema.index({ doctorId: 1, date: -1 });
appointmentSchema.index({ status: 1 });

export const Appointment = mongoose.model<IAppointment>('Appointment', appointmentSchema);
