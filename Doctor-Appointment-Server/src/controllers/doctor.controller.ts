import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Appointment } from '../models/Appointment';
import { Prescription } from '../models/Prescription';
import { Slot } from '../models/Slot';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../utils/errors';
import { parseLocalDate } from '../utils/date';

export async function deleteDoctorAppointments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError('Authentication required');

    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestError('No appointment IDs provided');
    }

    const validIds = (ids as unknown[]).filter(
      (id): id is string => typeof id === 'string' && mongoose.isValidObjectId(id),
    );
    if (validIds.length === 0) throw new BadRequestError('Invalid appointment IDs');

    const result = await Appointment.deleteMany({
      _id: { $in: validIds },
      doctorId: req.user.userId,
      status: 'Cancelled',
    });

    res.json({
      success: true,
      message: 'Appointments cleared',
      data: { deletedCount: result.deletedCount },
    });
  } catch (error) {
    next(error);
  }
}

export async function getDoctorAppointments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError('Authentication required');

    const { status, date, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const match: Record<string, unknown> = { doctorId: req.user.userId };
    if (status) match.status = status;
    if (date) {
      const d = parseLocalDate(date as string);
      const nextD = new Date(d);
      nextD.setDate(nextD.getDate() + 1);
      match.date = { $gte: d, $lt: nextD };
    }

    const appointments = await Appointment.find(match)
      .populate('patientId', 'firstName lastName phone email')
      .sort({ date: -1, startTime: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    const total = await Appointment.countDocuments(match);

    res.json({ success: true, data: { appointments, total } });
  } catch (error) {
    next(error);
  }
}

export async function getPatientDetailsForDoctor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError('Authentication required');
    const { patientId } = req.params;

    const appointments = await Appointment.find({ doctorId: req.user.userId, patientId })
      .populate('patientId', 'firstName lastName phone email')
      .sort({ date: -1 })
      .lean();

    const prescriptions = await Prescription.find({ doctorId: req.user.userId, patientId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: { appointments, prescriptions } });
  } catch (error) {
    next(error);
  }
}

export async function createPrescription(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError('Authentication required');
    const { appointmentId, symptoms, diagnosis, observations, medicines, labTests, advice, followUpDate } = req.body;

    const appointment = await Appointment.findOne({ _id: appointmentId, doctorId: req.user.userId });
    if (!appointment) throw new NotFoundError('Appointment not found');

    const prescription = await Prescription.create({
      appointmentId,
      patientId: appointment.patientId,
      doctorId: req.user.userId,
      symptoms: symptoms || [],
      diagnosis: diagnosis || [],
      observations,
      medicines: medicines || [],
      labTests: labTests || [],
      advice,
      followUpDate: followUpDate ? new Date(followUpDate) : undefined,
    });

    appointment.status = 'Completed';
    await appointment.save();

    res.status(201).json({ success: true, message: 'Prescription created', data: { prescription } });
  } catch (error) {
    next(error);
  }
}

export async function getSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError('Authentication required');
    const { weekStart } = req.query;
    const start = weekStart ? new Date(weekStart as string) : new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    const slots = await Slot.find({
      doctorId: req.user.userId,
      date: { $gte: start, $lt: end },
    }).sort({ date: 1, startTime: 1 }).lean();

    res.json({ success: true, data: { slots, weekStart: start, weekEnd: end } });
  } catch (error) {
    next(error);
  }
}

export async function createSlots(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError('Authentication required');
    const { slots } = req.body; // Array of { date, startTime, endTime, maxPatients }

    const created = await Slot.insertMany(
      slots.map((s: { date: string; startTime: string; endTime: string; maxPatients?: number }) => ({
        doctorId: req.user!.userId,
        date: parseLocalDate(s.date),
        startTime: s.startTime,
        endTime: s.endTime,
        maxPatients: s.maxPatients || 1,
      }))
    );

    res.status(201).json({ success: true, message: 'Slots created', data: { slots: created } });
  } catch (error) {
    next(error);
  }
}
