import { Request, Response, NextFunction } from 'express';
import { Appointment } from '../models/Appointment';
import { Bill } from '../models/Bill';
import { NotFoundError, UnauthorizedError } from '../utils/errors';
import crypto from 'crypto';

export async function createPaymentOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError('Authentication required');
    const { appointmentId } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) throw new NotFoundError('Appointment not found');

    // Mock order creation — in production, call Razorpay/Stripe API
    const orderId = 'order_' + crypto.randomBytes(12).toString('hex');

    res.json({
      success: true,
      data: {
        orderId,
        amount: appointment.totalAmount,
        currency: 'INR',
        appointmentId: appointment._id,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError('Authentication required');
    const { appointmentId, paymentId } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) throw new NotFoundError('Appointment not found');

    // Update bill as paid
    await Bill.findOneAndUpdate(
      { appointmentId },
      { paymentStatus: 'Paid', paidAt: new Date(), paymentMethod: 'Online' },
    );

    appointment.paymentStatus = 'Paid';
    await appointment.save();

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: { paymentId, appointmentId },
    });
  } catch (error) {
    next(error);
  }
}
