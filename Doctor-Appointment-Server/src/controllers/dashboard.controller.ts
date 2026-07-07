import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { Appointment } from '../models/Appointment';
import { Bill } from '../models/Bill';
import { UnauthorizedError } from '../utils/errors';

export async function getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const { role, userId } = req.user;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let stats: Record<string, unknown> = {};

    switch (role) {
      case 'Patient': {
        const upcomingAppointments = await Appointment.countDocuments({
          patientId: userId,
          date: { $gte: today },
          status: { $in: ['Pending', 'Confirmed', 'CheckedIn', 'InProgress'] },
        });
        const todayAppointment = await Appointment.findOne({
          patientId: userId,
          date: { $gte: today, $lt: tomorrow },
          status: { $ne: 'Cancelled' },
        }).populate('doctorId', 'firstName lastName').lean();
        const completedAppointments = await Appointment.countDocuments({
          patientId: userId,
          status: 'Completed',
        });

        stats = {
          upcomingAppointments,
          todayAppointment,
          completedAppointments,
          role,
        };
        break;
      }
      case 'Doctor': {
        const todayAppointments = await Appointment.countDocuments({
          doctorId: userId,
          date: { $gte: today, $lt: tomorrow },
          status: { $nin: ['Cancelled', 'NoShow'] },
        });
        const totalPatients = await Appointment.distinct('patientId', { doctorId: userId }).then(r => r.length);
        const pendingConsultations = await Appointment.countDocuments({
          doctorId: userId,
          status: { $in: ['Confirmed', 'CheckedIn'] },
        });
        const earnings = await Bill.aggregate([
          { $match: { paymentStatus: 'Paid' } },
          { $lookup: { from: 'appointments', localField: 'appointmentId', foreignField: '_id', as: 'appt' } },
          { $unwind: '$appt' },
          { $match: { 'appt.doctorId': userId } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ]).then(r => (r[0]?.total || 0));

        stats = { todayAppointments, totalPatients, pendingConsultations, earnings, role };
        break;
      }
      case 'Receptionist': {
        const todayBookings = await Appointment.countDocuments({
          date: { $gte: today, $lt: tomorrow },
        });
        const pendingCheckIns = await Appointment.countDocuments({
          date: { $gte: today, $lt: tomorrow },
          status: 'Confirmed',
        });
        const checkedIn = await Appointment.countDocuments({
          date: { $gte: today, $lt: tomorrow },
          status: 'CheckedIn',
        });

        stats = { todayBookings, pendingCheckIns, checkedIn, role };
        break;
      }
      case 'Admin':
      case 'SuperAdmin': {
        const totalDoctors = await User.countDocuments({ role: 'Doctor', isActive: true });
        const totalPatients = await User.countDocuments({ role: 'Patient', isActive: true });
        const totalReceptionists = await User.countDocuments({ role: 'Receptionist', isActive: true });
        const todayAppointments = await Appointment.countDocuments({
          date: { $gte: today, $lt: tomorrow },
        });
        const revenue = await Bill.aggregate([
          { $match: { paymentStatus: 'Paid' } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ]).then(r => (r[0]?.total || 0));
        const cancelledAppointments = await Appointment.countDocuments({
          status: 'Cancelled',
          createdAt: { $gte: today },
        });
        const pendingPayments = await Bill.countDocuments({ paymentStatus: 'Pending' });

        stats = {
          totalDoctors,
          totalPatients,
          totalReceptionists,
          totalUsers: totalDoctors + totalPatients + totalReceptionists,
          todayAppointments,
          revenue,
          cancelledAppointments,
          pendingPayments,
          role,
        };
        break;
      }
      default:
        stats = { role };
    }

    res.status(200).json({
      success: true,
      data: { stats },
    });
  } catch (error) {
    next(error);
  }
}
