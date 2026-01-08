'use strict';

const db = require('../models');
const { Op } = require('sequelize');
const notificationService = require('../services/notificationService');

class AppointmentController {

  /**
   * Create a new appointment (User books appointment with vet)
   * POST /api/appointments
   */
  async createAppointment(req, res) {
    try {
      const userId = req.user.id;
      const {
        veterinarian_id,
        animal_type,
        animal_name,
        animal_age,
        animal_breed,
        appointment_date,
        appointment_time,
        appointment_type,
        symptoms,
        contact_preference,
        farmer_name,
        farmer_phone,
        farmer_address,
        farmer_latitude,
        farmer_longitude,
        notes
      } = req.body;

      // Validate required fields
      if (!veterinarian_id || !animal_type || !appointment_date || !appointment_time || !farmer_name || !farmer_phone) {
        return res.status(400).json({
          success: false,
          message: 'Required fields: veterinarian_id, animal_type, appointment_date, appointment_time, farmer_name, farmer_phone'
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
      const appointmentDateTime = new Date(`${appointment_date} ${appointment_time}`);
      if (appointmentDateTime < new Date()) {
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
          appointment_time,
          status: {
            [Op.notIn]: ['cancelled', 'completed', 'no-show']
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
        animal_age,
        animal_breed,
        appointment_date,
        appointment_time,
        appointment_type: appointment_type || 'consultation',
        symptoms,
        contact_preference: contact_preference || 'both',
        farmer_name,
        farmer_phone,
        farmer_address,
        farmer_latitude: farmer_latitude ? parseFloat(farmer_latitude) : null,
        farmer_longitude: farmer_longitude ? parseFloat(farmer_longitude) : null,
        consultation_fee: veterinarian.consultation_fee,
        notes,
        status: 'pending'
      });

      // Send notification to veterinarian
      try {
        await notificationService.sendAppointmentNotification(veterinarian, appointment, 'new');
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
      const { status, page = 1, limit = 10 } = req.query;

      const where = { user_id: userId };
      if (status) where.status = status;

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
      const { status, date, page = 1, limit = 20 } = req.query;

      const where = { veterinarian_id: vetId };
      if (status) where.status = status;
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

      // Send notification to user
      try {
        await notificationService.sendAppointmentNotification(appointment.user, appointment, status);
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

      // Send notification to veterinarian
      try {
        await notificationService.sendAppointmentNotification(appointment.veterinarian, appointment, 'cancelled');
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
