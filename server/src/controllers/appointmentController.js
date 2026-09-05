'use strict';

const db = require('../models');
const { Op } = require('sequelize');
const notificationService = require('../services/notificationService');

const VALID_APPOINTMENT_STATUSES = ['pending', 'confirmed', 'cancelled', 'completed', 'no-show'];
const VALID_APPOINTMENT_TYPES = ['consultation', 'emergency', 'vaccination', 'surgery', 'checkup', 'other'];
const VALID_CONTACT_PREFERENCES = ['call', 'visit', 'both'];
const BLOCKING_APPOINTMENT_STATUSES = ['cancelled', 'completed', 'no-show'];
const RESCHEDULABLE_STATUSES = ['pending', 'confirmed'];

const normalizeTime = (time) => {
  if (!time || typeof time !== 'string') return null;
  const match = time.trim().match(/^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/);
  if (!match) return null;
  return `${match[1]}:${match[2]}:00`;
};

const isFutureAppointment = (date, time) => {
  const normalizedTime = normalizeTime(time);
  if (!date || !normalizedTime) return false;
  return new Date(`${date}T${normalizedTime}`) > new Date();
};

const mapUserAppointmentFilter = (filter) => {
  if (!filter || filter === 'all') return {};
  if (filter === 'upcoming') {
    return {
      appointment_date: { [Op.gte]: new Date().toISOString().split('T')[0] },
      status: { [Op.notIn]: ['cancelled', 'completed', 'no-show'] },
    };
  }
  if (filter === 'past') {
    return {
      [Op.or]: [
        { appointment_date: { [Op.lt]: new Date().toISOString().split('T')[0] } },
        { status: { [Op.in]: ['completed', 'no-show'] } },
      ],
    };
  }
  if (VALID_APPOINTMENT_STATUSES.includes(filter)) return { status: filter };
  return null;
};

class AppointmentController {

  /**
   * Create a new appointment (User books appointment with vet)
   * POST /api/appointments
   */
  async createAppointment(req, res) {
    try {
      const userId = req.user.id;
      const currentUser = req.user || {};
      const {
        veterinarian_id,
        animal_type,
        animal_name,
        animal_age,
        animal_breed,
        age,
        breed,
        appointment_date,
        appointment_time,
        appointment_type,
        symptoms,
        reason,
        contact_preference,
        farmer_name,
        farmer_phone,
        farmer_address,
        farmer_latitude,
        farmer_longitude,
        urgency,
        notes
      } = req.body;
      const normalizedAppointmentTime = normalizeTime(appointment_time);
      const resolvedFarmerName = farmer_name || currentUser.full_name;
      const resolvedFarmerPhone = farmer_phone || currentUser.phone_number;
      const resolvedSymptoms = symptoms || reason;
      const resolvedAppointmentType = appointment_type || (urgency === 'emergency' ? 'emergency' : 'consultation');

      // Validate required fields
      if (!veterinarian_id || !animal_type || !appointment_date || !normalizedAppointmentTime || !resolvedFarmerName || !resolvedFarmerPhone) {
        return res.status(400).json({
          success: false,
          message: 'Required fields: veterinarian_id, animal_type, appointment_date, appointment_time, farmer_name, farmer_phone'
        });
      }

      if (!VALID_APPOINTMENT_TYPES.includes(resolvedAppointmentType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid appointment type'
        });
      }

      if (contact_preference && !VALID_CONTACT_PREFERENCES.includes(contact_preference)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid contact preference'
        });
      }

      // Check if veterinarian exists and is verified
      const veterinarian = await db.Veterinarian.findOne({
        where: {
          id: veterinarian_id,
          verification_status: 'verified',
          is_active: true
        }
      });

      if (!veterinarian) {
        return res.status(404).json({
          success: false,
          message: 'Veterinarian not found or not available'
        });
      }

      // Check if appointment date is in the future
      if (!isFutureAppointment(appointment_date, normalizedAppointmentTime)) {
        return res.status(400).json({
          success: false,
          message: 'Appointment date and time must be in the future'
        });
      }

      // Check for conflicting appointments (same vet, same date/time)
      const conflictingAppointment = await db.Appointment.findOne({
        where: {
          veterinarian_id,
          appointment_date,
          appointment_time: normalizedAppointmentTime,
          status: {
            [Op.notIn]: BLOCKING_APPOINTMENT_STATUSES
          }
        }
      });

      if (conflictingAppointment) {
        return res.status(400).json({
          success: false,
          message: 'This time slot is already booked. Please choose another time.'
        });
      }

      // Create appointment
      const appointment = await db.Appointment.create({
        user_id: userId,
        veterinarian_id,
        animal_type,
        animal_name,
        animal_age: animal_age || age,
        animal_breed: animal_breed || breed,
        appointment_date,
        appointment_time: normalizedAppointmentTime,
        appointment_type: resolvedAppointmentType,
        symptoms: resolvedSymptoms,
        contact_preference: contact_preference || 'both',
        farmer_name: resolvedFarmerName,
        farmer_phone: resolvedFarmerPhone,
        farmer_address: farmer_address || currentUser.address,
        farmer_latitude: farmer_latitude ? parseFloat(farmer_latitude) : null,
        farmer_longitude: farmer_longitude ? parseFloat(farmer_longitude) : null,
        consultation_fee: veterinarian.consultation_fee,
        notes: notes || reason,
        status: 'pending'
      });

      // Send real-time notification to veterinarian
      try {
        await notificationService.sendRealtimeNotification(
          veterinarian.id,
          '🔔 New Appointment Request',
          `${resolvedFarmerName} has booked an appointment for ${animal_type} on ${appointment_date} at ${normalizedAppointmentTime}`,
          {
            type: 'new_appointment',
            appointmentId: appointment.id,
            animalType: animal_type,
            appointmentDate: appointment_date,
            appointmentTime: normalizedAppointmentTime
          },
          db,
          'veterinarian'
        );
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
      }

      // Increment veterinarian's total patients count
      await veterinarian.increment('total_patients');

      // Fetch the complete appointment with relationships
      const completeAppointment = await db.Appointment.findByPk(appointment.id, {
        include: [
          {
            model: db.Veterinarian,
            as: 'veterinarian',
            attributes: ['id', 'full_name', 'phone_number', 'email', 'clinic_name', 'clinic_address']
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Appointment booked successfully! The veterinarian will be notified.',
        data: completeAppointment
      });
    } catch (error) {
      console.error('Create appointment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to book appointment',
        error: error.message
      });
    }
  }

  /**
   * Get user's appointments
   * GET /api/appointments/my-appointments
   */
  async getUserAppointments(req, res) {
    try {
      const userId = req.user.id;
      const { status, filter, page = 1, limit = 10 } = req.query;

      const where = { user_id: userId };
      const requestedFilter = status || filter;
      if (requestedFilter) {
        const filterWhere = mapUserAppointmentFilter(requestedFilter);
        if (!filterWhere) {
          return res.status(400).json({
            success: false,
            message: 'Invalid appointment filter'
          });
        }
        Object.assign(where, filterWhere);
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const appointments = await db.Appointment.findAndCountAll({
        where,
        include: [
          {
            model: db.Veterinarian,
            as: 'veterinarian',
            attributes: ['id', 'full_name', 'phone_number', 'email', 'profile_photo', 'specialization', 'clinic_name', 'clinic_address', 'city', 'state']
          }
        ],
        order: [['appointment_date', 'DESC'], ['appointment_time', 'DESC']],
        limit: parseInt(limit),
        offset
      });

      res.json({
        success: true,
        data: {
          appointments: appointments.rows,
          totalCount: appointments.count,
          currentPage: parseInt(page),
          totalPages: Math.ceil(appointments.count / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('Get user appointments error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch appointments',
        error: error.message
      });
    }
  }

  /**
   * Get veterinarian's appointments
   * GET /api/appointments/vet-appointments
   */
  async getVetAppointments(req, res) {
    try {
      const vetId = req.vet.id;
      const { status, filter, date, page = 1, limit = 20 } = req.query;

      const where = { veterinarian_id: vetId };
      const requestedStatus = status || (filter === 'all' ? null : filter);
      if (requestedStatus) {
        if (!VALID_APPOINTMENT_STATUSES.includes(requestedStatus)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid appointment status filter'
          });
        }
        where.status = requestedStatus;
      }
      if (date) where.appointment_date = date;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const appointments = await db.Appointment.findAndCountAll({
        where,
        include: [
          {
            model: db.User,
            as: 'user',
            attributes: ['id', 'full_name', 'phone_number']
          }
        ],
        order: [['appointment_date', 'ASC'], ['appointment_time', 'ASC']],
        limit: parseInt(limit),
        offset
      });

      // Get today's appointments count
      const today = new Date().toISOString().split('T')[0];
      const todayCount = await db.Appointment.count({
        where: {
          veterinarian_id: vetId,
          appointment_date: today,
          status: {
            [Op.notIn]: ['cancelled', 'no-show']
          }
        }
      });

      // Get pending appointments count
      const pendingCount = await db.Appointment.count({
        where: {
          veterinarian_id: vetId,
          status: 'pending'
        }
      });

      res.json({
        success: true,
        data: {
          appointments: appointments.rows,
          totalCount: appointments.count,
          todayCount,
          pendingCount,
          currentPage: parseInt(page),
          totalPages: Math.ceil(appointments.count / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('Get vet appointments error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch appointments',
        error: error.message
      });
    }
  }

  /**
   * Get single appointment details
   * GET /api/appointments/:id
   */
  async getAppointmentById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const vetId = req.vet?.id;

      const appointment = await db.Appointment.findByPk(id, {
        include: [
          {
            model: db.User,
            as: 'user',
            attributes: ['id', 'full_name', 'phone_number', 'email']
          },
          {
            model: db.Veterinarian,
            as: 'veterinarian',
            attributes: ['id', 'full_name', 'phone_number', 'email', 'profile_photo', 'specialization', 'clinic_name', 'clinic_address']
          }
        ]
      });

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found'
        });
      }

      // Check if user has permission to view this appointment
      if (userId && appointment.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      if (vetId && appointment.veterinarian_id !== vetId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      res.json({
        success: true,
        data: appointment
      });
    } catch (error) {
      console.error('Get appointment by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch appointment',
        error: error.message
      });
    }
  }

  /**
   * Update appointment status (Vet confirms/rejects)
   * PATCH /api/appointments/:id/status
   */
  async updateAppointmentStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, vet_notes, cancellation_reason } = req.body;
      const vetId = req.vet.id;

      const appointment = await db.Appointment.findByPk(id, {
        include: [
          {
            model: db.User,
            as: 'user'
          }
        ]
      });

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found'
        });
      }

      // Check if vet owns this appointment
      if (appointment.veterinarian_id !== vetId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Validate status transition
      const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed', 'no-show'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status'
        });
      }

      const updateData = { status };

      if (vet_notes) {
        updateData.vet_notes = vet_notes;
      }

      if (status === 'confirmed') {
        updateData.confirmed_at = new Date();
      } else if (status === 'completed') {
        updateData.completed_at = new Date();
      } else if (status === 'cancelled') {
        updateData.cancelled_by = 'veterinarian';
        updateData.cancellation_reason = cancellation_reason;
        updateData.cancelled_at = new Date();
      }

      await appointment.update(updateData);

      // Send real-time notification to user
      try {
        let title, body;
        switch (status) {
          case 'confirmed':
            title = '✅ Appointment Confirmed';
            body = `Your appointment for ${appointment.appointment_date} at ${appointment.appointment_time} has been confirmed`;
            break;
          case 'cancelled':
            title = '❌ Appointment Cancelled';
            body = `Appointment for ${appointment.appointment_date} has been cancelled`;
            break;
          case 'completed':
            title = '✔️ Appointment Completed';
            body = `Your appointment has been marked as completed`;
            break;
          default:
            title = 'Appointment Update';
            body = `Your appointment status has been updated to ${status}`;
        }

        await notificationService.sendRealtimeNotification(
          appointment.user.id,
          title,
          body,
          {
            type: `appointment_${status}`,
            appointmentId: appointment.id,
            status: status
          },
          db
        );
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
      }

      res.json({
        success: true,
        message: `Appointment ${status} successfully`,
        data: appointment
      });
    } catch (error) {
      console.error('Update appointment status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update appointment',
        error: error.message
      });
    }
  }

  /**
   * Cancel appointment (User cancels)
   * PATCH /api/appointments/:id/cancel
   */
  async cancelAppointment(req, res) {
    try {
      const { id } = req.params;
      const { cancellation_reason } = req.body;
      const userId = req.user.id;

      const appointment = await db.Appointment.findByPk(id, {
        include: [
          {
            model: db.Veterinarian,
            as: 'veterinarian'
          }
        ]
      });

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found'
        });
      }

      // Check if user owns this appointment
      if (appointment.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Check if appointment can be cancelled
      if (['cancelled', 'completed'].includes(appointment.status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot cancel ${appointment.status} appointment`
        });
      }

      await appointment.update({
        status: 'cancelled',
        cancelled_by: 'user',
        cancellation_reason,
        cancelled_at: new Date()
      });

      // Send real-time notification to veterinarian
      try {
        await notificationService.sendRealtimeNotification(
          appointment.veterinarian.id,
          '❌ Appointment Cancelled',
          `${appointment.farmer_name} cancelled appointment for ${appointment.appointment_date} at ${appointment.appointment_time}`,
          {
            type: 'appointment_cancelled',
            appointmentId: appointment.id,
            cancelledBy: 'user',
            reason: cancellation_reason
          },
          db,
          'veterinarian'
        );
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
      }

      res.json({
        success: true,
        message: 'Appointment cancelled successfully',
        data: appointment
      });
    } catch (error) {
      console.error('Cancel appointment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel appointment',
        error: error.message
      });
    }
  }

  /**
   * Reschedule appointment (User chooses a new slot)
   * PATCH /api/appointments/:id/reschedule
   */
  async rescheduleAppointment(req, res) {
    try {
      const { id } = req.params;
      const { appointment_date, appointment_time } = req.body;
      const userId = req.user.id;
      const normalizedAppointmentTime = normalizeTime(appointment_time);

      if (!appointment_date || !normalizedAppointmentTime) {
        return res.status(400).json({
          success: false,
          message: 'appointment_date and appointment_time are required'
        });
      }

      if (!isFutureAppointment(appointment_date, normalizedAppointmentTime)) {
        return res.status(400).json({
          success: false,
          message: 'Appointment date and time must be in the future'
        });
      }

      const appointment = await db.Appointment.findByPk(id, {
        include: [
          {
            model: db.Veterinarian,
            as: 'veterinarian'
          }
        ]
      });

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found'
        });
      }

      if (appointment.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      if (!RESCHEDULABLE_STATUSES.includes(appointment.status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot reschedule ${appointment.status} appointment`
        });
      }

      const conflictingAppointment = await db.Appointment.findOne({
        where: {
          id: { [Op.ne]: appointment.id },
          veterinarian_id: appointment.veterinarian_id,
          appointment_date,
          appointment_time: normalizedAppointmentTime,
          status: {
            [Op.notIn]: BLOCKING_APPOINTMENT_STATUSES
          }
        }
      });

      if (conflictingAppointment) {
        return res.status(400).json({
          success: false,
          message: 'This time slot is already booked. Please choose another time.'
        });
      }

      await appointment.update({
        appointment_date,
        appointment_time: normalizedAppointmentTime,
        status: 'pending',
        confirmed_at: null,
        reminder_sent_at: null
      });

      try {
        await notificationService.sendRealtimeNotification(
          appointment.veterinarian.id,
          'Appointment Rescheduled',
          `${appointment.farmer_name} rescheduled appointment to ${appointment_date} at ${normalizedAppointmentTime}`,
          {
            type: 'appointment_rescheduled',
            appointmentId: appointment.id,
            appointmentDate: appointment_date,
            appointmentTime: normalizedAppointmentTime
          },
          db,
          'veterinarian'
        );
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
      }

      res.json({
        success: true,
        message: 'Appointment rescheduled successfully',
        data: appointment
      });
    } catch (error) {
      console.error('Reschedule appointment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reschedule appointment',
        error: error.message
      });
    }
  }

  /**
   * Get available appointment slots for a veterinarian
   * GET /api/appointments/available-slots/:vetId?date=YYYY-MM-DD
   */
  async getAvailableSlots(req, res) {
    try {
      const { vetId } = req.params;
      const { date } = req.query;

      if (!date) {
        return res.status(400).json({
          success: false,
          message: 'date query parameter is required'
        });
      }

      const veterinarian = await db.Veterinarian.findOne({
        where: {
          id: vetId,
          verification_status: 'verified',
          is_active: true
        }
      });

      if (!veterinarian) {
        return res.status(404).json({
          success: false,
          message: 'Veterinarian not found or not available'
        });
      }

      const bookedAppointments = await db.Appointment.findAll({
        attributes: ['appointment_time'],
        where: {
          veterinarian_id: vetId,
          appointment_date: date,
          status: {
            [Op.notIn]: BLOCKING_APPOINTMENT_STATUSES
          }
        }
      });

      const bookedTimes = new Set(
        bookedAppointments.map((appointment) => normalizeTime(String(appointment.appointment_time)))
      );
      const slots = [];
      const now = new Date();

      for (let hour = 9; hour <= 18; hour += 1) {
        for (let minute = 0; minute < 60; minute += 30) {
          const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
          const normalizedTime = `${time}:00`;
          const slotDateTime = new Date(`${date}T${normalizedTime}`);

          if (slotDateTime <= now) {
            continue;
          }

          slots.push({
            time,
            available: !bookedTimes.has(normalizedTime)
          });
        }
      }

      res.json({
        success: true,
        data: {
          date,
          slots
        }
      });
    } catch (error) {
      console.error('Get available slots error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch available slots',
        error: error.message
      });
    }
  }

  /**
   * Get appointment statistics for vet dashboard
   * GET /api/appointments/vet/stats
   */
  async getVetStats(req, res) {
    try {
      const vetId = req.vet.id;
      const today = new Date().toISOString().split('T')[0];

      const [
        totalAppointments,
        todayAppointments,
        pendingAppointments,
        completedAppointments,
        cancelledAppointments
      ] = await Promise.all([
        db.Appointment.count({ where: { veterinarian_id: vetId } }),
        db.Appointment.count({
          where: {
            veterinarian_id: vetId,
            appointment_date: today,
            status: { [Op.notIn]: ['cancelled', 'no-show'] }
          }
        }),
        db.Appointment.count({
          where: { veterinarian_id: vetId, status: 'pending' }
        }),
        db.Appointment.count({
          where: { veterinarian_id: vetId, status: 'completed' }
        }),
        db.Appointment.count({
          where: { veterinarian_id: vetId, status: 'cancelled' }
        })
      ]);

      res.json({
        success: true,
        data: {
          totalAppointments,
          todayAppointments,
          pendingAppointments,
          completedAppointments,
          cancelledAppointments
        }
      });
    } catch (error) {
      console.error('Get vet stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch statistics',
        error: error.message
      });
    }
  }
}

module.exports = new AppointmentController();
