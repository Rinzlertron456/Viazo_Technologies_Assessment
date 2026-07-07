import { Request, Response, NextFunction } from 'express';
import { Appointment } from '../models/Appointment';
import { Bill } from '../models/Bill';
import { NotFoundError, UnauthorizedError } from '../utils/errors';

export async function getTodayQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError('Authentication required');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointments = await Appointment.find({
      date: { $gte: today, $lt: tomorrow },
      status: { $in: ['Confirmed', 'CheckedIn', 'InProgress', 'Pending'] },
    })
      .populate('patientId', 'firstName lastName phone')
      .populate('doctorId', 'firstName lastName')
      .sort({ date: 1, startTime: 1 })
      .lean();

    res.json({ success: true, data: { queue: appointments } });
  } catch (error) {
    next(error);
  }
}

export async function walkInRegistration(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError('Authentication required');
    const { patientId, doctorId, reason } = req.body;

    const now = new Date();
    const appointment = await Appointment.create({
      patientId,
      doctorId,
      date: now,
      startTime: now.toTimeString().slice(0, 5),
      endTime: new Date(now.getTime() + 30 * 60000).toTimeString().slice(0, 5),
      type: 'Clinic',
      status: 'CheckedIn',
      reason,
      createdBy: req.user.userId,
    });

    const populated = await Appointment.findById(appointment._id)
      .populate('patientId', 'firstName lastName')
      .populate('doctorId', 'firstName lastName');

    res.status(201).json({ success: true, message: 'Walk-in registered', data: { appointment: populated } });
  } catch (error) {
    next(error);
  }
}

export async function checkInPatient(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError('Authentication required');
    const { id } = req.params;

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      { status: 'CheckedIn' },
      { new: true }
    ).populate('patientId', 'firstName lastName');

    if (!appointment) throw new NotFoundError('Appointment not found');

    res.json({ success: true, message: 'Patient checked in', data: { appointment } });
  } catch (error) {
    next(error);
  }
}

export async function createBill(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError('Authentication required');
    const { appointmentId, consultationFee, discount, tax, paymentMethod } = req.body;
    const totalAmount = (consultationFee || 0) - (discount || 0) + (tax || 0);

    const invNum = `INV-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const bill = await Bill.create({
      appointmentId,
      patientId: req.body.patientId,
      consultationFee: consultationFee || 0,
      discount: discount || 0,
      tax: tax || 0,
      totalAmount,
      paymentMethod,
      invoiceNumber: invNum,
    });

    if (paymentMethod) {
      bill.paymentStatus = 'Paid';
      bill.paidAt = new Date();
      await bill.save();
    }

    res.status(201).json({ success: true, message: 'Bill created', data: { bill } });
  } catch (error) {
    next(error);
  }
}
