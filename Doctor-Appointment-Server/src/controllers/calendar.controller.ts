import { Request, Response, NextFunction } from 'express';
import { Appointment } from '../models/Appointment';
import { UnauthorizedError } from '../utils/errors';

export async function getCalendarAppointments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError('Authentication required');
    const { start, end } = req.query;
    const match: Record<string, unknown> = {};
    
    if (start && end) {
      match.date = { $gte: new Date(start as string), $lte: new Date(end as string) };
    }
    
    if (req.user.role === 'Doctor') match.doctorId = req.user.userId;
    else if (req.user.role === 'Patient') match.patientId = req.user.userId;

    const appointments = await Appointment.find(match)
      .populate('patientId', 'firstName lastName phone')
      .populate('doctorId', 'firstName lastName')
      .sort({ date: 1, startTime: 1 })
      .lean();

    res.json({ success: true, data: { appointments } });
  } catch (error) { next(error); }
}
