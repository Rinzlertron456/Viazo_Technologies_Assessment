import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { Appointment } from '../models/Appointment';
import { Bill } from '../models/Bill';

export async function getRevenueReport(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const report = await Bill.aggregate([
      { $match: { paymentStatus: 'Paid' } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$paidAt' } },
        totalRevenue: { $sum: '$totalAmount' },
        count: { $sum: 1 },
      }},
      { $sort: { _id: 1 } },
      { $project: { month: '$_id', totalRevenue: 1, count: 1, _id: 0 } },
    ]);
    res.json({ success: true, data: { report } });
  } catch (error) { next(error); }
}

export async function getDoctorPerformance(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const report = await Appointment.aggregate([
      { $group: {
        _id: '$doctorId',
        totalAppointments: { $sum: 1 },
        completedCount: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
        cancelledCount: { $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] } },
      }},
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'doctor' } },
      { $unwind: { path: '$doctor', preserveNullAndEmptyArrays: true } },
      { $project: {
        doctorName: { $concat: ['$doctor.firstName', ' ', '$doctor.lastName'] },
        totalAppointments: 1, completedCount: 1, cancelledCount: 1,
      }},
      { $sort: { totalAppointments: -1 } },
    ]);
    res.json({ success: true, data: { report } });
  } catch (error) { next(error); }
}

export async function getPatientGrowth(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const report = await User.aggregate([
      { $match: { role: 'Patient' } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        count: { $sum: 1 },
      }},
      { $sort: { _id: 1 } },
      { $project: { month: '$_id', count: 1, _id: 0 } },
    ]);
    res.json({ success: true, data: { report } });
  } catch (error) { next(error); }
}

export async function getNoShowReport(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const report = await Appointment.aggregate([
      { $match: { status: 'NoShow' } },
      { $group: { _id: '$doctorId', count: { $sum: 1 } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'doctor' } },
      { $unwind: { path: '$doctor', preserveNullAndEmptyArrays: true } },
      { $project: { doctorName: { $concat: ['$doctor.firstName', ' ', '$doctor.lastName'] }, count: 1 } },
      { $sort: { count: -1 } },
    ]);
    res.json({ success: true, data: { report } });
  } catch (error) { next(error); }
}
