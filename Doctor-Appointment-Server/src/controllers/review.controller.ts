import { Request, Response, NextFunction } from 'express';
import { Review } from '../models/Review';
import { Appointment } from '../models/Appointment';
import { NotFoundError, UnauthorizedError, BadRequestError } from '../utils/errors';

export async function createReview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError('Authentication required');
    const { appointmentId, rating, comment } = req.body;

    const appointment = await Appointment.findOne({ _id: appointmentId, patientId: req.user.userId });
    if (!appointment) throw new NotFoundError('Appointment not found');
    if (appointment.status === 'Cancelled') throw new BadRequestError('Cannot review a cancelled appointment');

    const existing = await Review.findOne({ appointmentId });
    if (existing) throw new BadRequestError('Already reviewed this appointment');

    const review = await Review.create({
      appointmentId,
      patientId: req.user.userId,
      doctorId: appointment.doctorId,
      rating,
      comment,
    });

    res.status(201).json({ success: true, message: 'Review submitted', data: { review } });
  } catch (error) {
    next(error);
  }
}

export async function getDoctorReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { doctorId } = req.params;
    const reviews = await Review.find({ doctorId })
      .populate('patientId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: { reviews } });
  } catch (error) {
    next(error);
  }
}

export async function replyToReview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError('Authentication required');
    const { id } = req.params;
    const { reply } = req.body;

    const review = await Review.findById(id);
    if (!review) throw new NotFoundError('Review not found');

    const appointment = await Appointment.findById(review.appointmentId);
    if (!appointment || appointment.doctorId.toString() !== req.user.userId) {
      throw new UnauthorizedError('Not authorized to reply to this review');
    }

    review.reply = reply;
    await review.save();

    res.json({ success: true, message: 'Reply added', data: { review } });
  } catch (error) {
    next(error);
  }
}
