'use strict';

const { Op } = require('sequelize');
const db = require('../models');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');

const VALID_PET_TYPES = ['dog', 'cat'];
const VALID_GENDERS = ['male', 'female'];
const VALID_STATUSES = ['pending', 'active', 'paused', 'matched', 'rejected', 'removed'];
const PUBLIC_STATUSES = ['active'];
const VALID_REPORT_REASONS = ['fake', 'inappropriate', 'wrong_information', 'spam', 'animal_welfare', 'other'];

const parseBoolean = (value) => value === true || value === 'true' || value === '1';
const cleanString = (value) => {
  if (value === undefined || value === null) return undefined;
  const next = String(value).trim();
  return next || null;
};
const cleanNumber = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const next = Number(value);
  return Number.isFinite(next) ? next : null;
};

const getOwnerInclude = () => ([{
  model: db.User,
  as: 'owner',
  attributes: ['id', 'full_name', 'phone_number', 'city', 'state', 'profile_photo']
}]);

const buildWhere = (query = {}, admin = false) => {
  const where = {};
  const {
    search,
    petType,
    breed,
    gender,
    city,
    state,
    status,
    featured
  } = query;

  if (!admin) {
    where.status = { [Op.in]: PUBLIC_STATUSES };
  } else if (status && status !== 'all' && VALID_STATUSES.includes(status)) {
    where.status = status;
  }

  if (petType && VALID_PET_TYPES.includes(String(petType).toLowerCase())) {
    where.pet_type = String(petType).toLowerCase();
  }

  if (gender && VALID_GENDERS.includes(String(gender).toLowerCase())) {
    where.gender = String(gender).toLowerCase();
  }

  if (breed) {
    where.breed = { [Op.iLike]: `%${String(breed).trim()}%` };
  }

  if (city) {
    where.city = { [Op.iLike]: `%${String(city).trim()}%` };
  }

  if (state) {
    where.state = { [Op.iLike]: `%${String(state).trim()}%` };
  }

  if (featured !== undefined) {
    where.is_featured = parseBoolean(featured);
  }

  if (search) {
    const term = `%${String(search).trim()}%`;
    where[Op.or] = [
      { pet_name: { [Op.iLike]: term } },
      { breed: { [Op.iLike]: term } },
      { city: { [Op.iLike]: term } },
      { description: { [Op.iLike]: term } }
    ];
  }

  return where;
};

const buildPayload = (body = {}, existing = null) => {
  const payload = {};

  [
    'pet_name',
    'breed',
    'color',
    'last_vaccination_date',
    'last_deworming_date',
    'health_certificate_url',
    'registered_with',
    'temperament',
    'preferred_breed',
    'available_from',
    'available_to',
    'description',
    'medical_notes',
    'owner_name',
    'owner_phone',
    'city',
    'state',
    'postal_code',
    'admin_notes'
  ].forEach((field) => {
    if (body[field] !== undefined) {
      payload[field] = cleanString(body[field]);
    }
  });

  if (body.pet_type !== undefined) {
    const petType = String(body.pet_type).toLowerCase();
    payload.pet_type = VALID_PET_TYPES.includes(petType) ? petType : existing?.pet_type;
  }

  if (body.gender !== undefined) {
    const gender = String(body.gender).toLowerCase();
    payload.gender = VALID_GENDERS.includes(gender) ? gender : existing?.gender;
  }

  if (body.vaccination_status !== undefined) {
    payload.vaccination_status = ['unknown', 'not_vaccinated', 'partial', 'up_to_date'].includes(body.vaccination_status)
      ? body.vaccination_status
      : 'unknown';
  }

  if (body.deworming_status !== undefined) {
    payload.deworming_status = ['unknown', 'not_done', 'done'].includes(body.deworming_status)
      ? body.deworming_status
      : 'unknown';
  }

  if (body.mating_experience !== undefined) {
    payload.mating_experience = ['first_time', 'experienced', 'unknown'].includes(body.mating_experience)
      ? body.mating_experience
      : 'unknown';
  }

  if (body.fee_type !== undefined) {
    payload.fee_type = ['free', 'paid', 'negotiable'].includes(body.fee_type) ? body.fee_type : 'negotiable';
  }

  if (body.preferred_gender !== undefined) {
    payload.preferred_gender = ['male', 'female', 'any'].includes(body.preferred_gender) ? body.preferred_gender : 'any';
  }

  if (body.status !== undefined && VALID_STATUSES.includes(body.status)) {
    payload.status = body.status;
    payload.published_at = body.status === 'active' ? existing?.published_at || new Date() : existing?.published_at;
  }

  if (body.age_months !== undefined) payload.age_months = cleanNumber(body.age_months);
  if (body.weight_kg !== undefined) payload.weight_kg = cleanNumber(body.weight_kg);
  if (body.fee_amount !== undefined) payload.fee_amount = cleanNumber(body.fee_amount);
  if (body.latitude !== undefined) payload.latitude = cleanNumber(body.latitude);
  if (body.longitude !== undefined) payload.longitude = cleanNumber(body.longitude);
  if (body.pedigree_available !== undefined) payload.pedigree_available = parseBoolean(body.pedigree_available);
  if (body.is_featured !== undefined) payload.is_featured = parseBoolean(body.is_featured);

  return payload;
};

const uploadProfileMedia = async (files = {}, existing = null) => {
  const payload = {};
  const photoFiles = files.photos || [];
  const videoFile = files.video?.[0];

  if (photoFiles.length > 0) {
    if (existing?.photo_public_ids?.length) {
      await Promise.all(existing.photo_public_ids.map((id) => deleteFromCloudinary(id, 'image').catch(() => null)));
    }

    const uploads = await Promise.all(
      photoFiles.map((file) => uploadToCloudinary(file, 'pet-mating/photos', 'image'))
    );
    payload.photos = uploads.map((item) => item.secure_url);
    payload.photo_public_ids = uploads.map((item) => item.public_id);
  }

  if (videoFile) {
    if (existing?.video_public_id) {
      await deleteFromCloudinary(existing.video_public_id, 'video').catch(() => null);
    }
    const upload = await uploadToCloudinary(videoFile, 'pet-mating/videos', 'video');
    payload.video_url = upload.secure_url;
    payload.video_public_id = upload.public_id;
  }

  return payload;
};

class PetMatingController {
  async getProfiles(req, res) {
    try {
      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.min(50, Math.max(1, Number(req.query.limit || 12)));
      const offset = (page - 1) * limit;
      const where = buildWhere(req.query, false);
      if (req.user?.id) {
        where.user_id = { [Op.ne]: req.user.id };
      }

      const { count, rows } = await db.PetMatingProfile.findAndCountAll({
        where,
        include: getOwnerInclude(),
        order: [['is_featured', 'DESC'], ['published_at', 'DESC'], ['created_at', 'DESC']],
        limit,
        offset
      });

      res.json({
        success: true,
        data: {
          profiles: rows,
          total: count,
          page,
          totalPages: Math.ceil(count / limit) || 1
        }
      });
    } catch (error) {
      console.error('Get pet mating profiles error:', error);
      res.status(500).json({ success: false, message: 'Failed to load pet mating profiles' });
    }
  }

  async getProfileById(req, res) {
    try {
      const profile = await db.PetMatingProfile.findOne({
        where: { id: req.params.id, status: { [Op.in]: PUBLIC_STATUSES } },
        include: getOwnerInclude()
      });

      if (!profile) {
        return res.status(404).json({ success: false, message: 'Pet mating profile not found' });
      }

      await profile.increment('views');
      await profile.reload({ include: getOwnerInclude() });

      res.json({ success: true, data: { profile } });
    } catch (error) {
      console.error('Get pet mating profile error:', error);
      res.status(500).json({ success: false, message: 'Failed to load pet mating profile' });
    }
  }

  async getMyProfiles(req, res) {
    try {
      const profiles = await db.PetMatingProfile.findAll({
        where: { user_id: req.user.id },
        order: [['created_at', 'DESC']]
      });

      res.json({ success: true, data: { profiles } });
    } catch (error) {
      console.error('Get my pet mating profiles error:', error);
      res.status(500).json({ success: false, message: 'Failed to load your pet mating profiles' });
    }
  }

  async createProfile(req, res) {
    try {
      const payload = buildPayload(req.body);
      payload.user_id = req.user.id;
      payload.status = 'active';
      payload.published_at = new Date();

      if (!payload.pet_type || !payload.pet_name || !payload.breed || !payload.gender) {
        return res.status(400).json({
          success: false,
          message: 'Pet type, pet name, breed, and gender are required'
        });
      }

      const mediaPayload = await uploadProfileMedia(req.files || {});
      if (!mediaPayload.photos || mediaPayload.photos.length === 0) {
        return res.status(400).json({ success: false, message: 'At least one pet photo is required' });
      }

      const profile = await db.PetMatingProfile.create({ ...payload, ...mediaPayload });
      res.status(201).json({ success: true, message: 'Pet mating profile created successfully', data: { profile } });
    } catch (error) {
      console.error('Create pet mating profile error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create pet mating profile' });
    }
  }

  async updateProfile(req, res) {
    try {
      const profile = await db.PetMatingProfile.findOne({
        where: { id: req.params.id, user_id: req.user.id }
      });

      if (!profile) {
        return res.status(404).json({ success: false, message: 'Pet mating profile not found' });
      }

      const payload = buildPayload(req.body, profile);
      const mediaPayload = await uploadProfileMedia(req.files || {}, profile);
      await profile.update({ ...payload, ...mediaPayload });

      res.json({ success: true, message: 'Pet mating profile updated successfully', data: { profile } });
    } catch (error) {
      console.error('Update pet mating profile error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to update pet mating profile' });
    }
  }

  async deleteProfile(req, res) {
    try {
      const profile = await db.PetMatingProfile.findOne({
        where: { id: req.params.id, user_id: req.user.id }
      });

      if (!profile) {
        return res.status(404).json({ success: false, message: 'Pet mating profile not found' });
      }

      await profile.update({ status: 'removed' });
      res.json({ success: true, message: 'Pet mating profile removed successfully' });
    } catch (error) {
      console.error('Delete pet mating profile error:', error);
      res.status(500).json({ success: false, message: 'Failed to remove pet mating profile' });
    }
  }

  async markMatched(req, res) {
    try {
      const profile = await db.PetMatingProfile.findOne({
        where: { id: req.params.id, user_id: req.user.id }
      });

      if (!profile) {
        return res.status(404).json({ success: false, message: 'Pet mating profile not found' });
      }

      await profile.update({ status: 'matched' });
      res.json({ success: true, message: 'Pet mating profile marked as matched', data: { profile } });
    } catch (error) {
      console.error('Mark pet mating matched error:', error);
      res.status(500).json({ success: false, message: 'Failed to update pet mating profile' });
    }
  }

  async trackContact(req, res) {
    try {
      const profile = await db.PetMatingProfile.findByPk(req.params.id);
      if (!profile || profile.status !== 'active') {
        return res.status(404).json({ success: false, message: 'Pet mating profile not found' });
      }

      if (String(profile.user_id) === String(req.user.id)) {
        return res.status(400).json({ success: false, message: 'You cannot contact your own mating profile' });
      }

      await profile.increment('contact_count');
      res.json({
        success: true,
        data: {
          owner_phone: profile.owner_phone,
          owner_name: profile.owner_name
        }
      });
    } catch (error) {
      console.error('Track pet mating contact error:', error);
      res.status(500).json({ success: false, message: 'Failed to track contact' });
    }
  }

  async reportProfile(req, res) {
    try {
      const profile = await db.PetMatingProfile.findByPk(req.params.id);
      if (!profile || profile.status === 'removed') {
        return res.status(404).json({ success: false, message: 'Pet mating profile not found' });
      }

      if (String(profile.user_id) === String(req.user.id)) {
        return res.status(400).json({ success: false, message: 'You cannot report your own mating profile' });
      }

      const reason = VALID_REPORT_REASONS.includes(req.body.reason) ? req.body.reason : 'other';
      const report = await db.PetMatingReport.create({
        profile_id: profile.id,
        reporter_id: req.user?.id || null,
        reason,
        description: cleanString(req.body.description)
      });

      await profile.increment('report_count');
      res.status(201).json({ success: true, message: 'Profile reported for review', data: { report } });
    } catch (error) {
      console.error('Report pet mating profile error:', error);
      res.status(500).json({ success: false, message: 'Failed to report profile' });
    }
  }

  async adminGetProfiles(req, res) {
    try {
      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
      const offset = (page - 1) * limit;
      const where = buildWhere(req.query, true);

      const { count, rows } = await db.PetMatingProfile.findAndCountAll({
        where,
        include: getOwnerInclude(),
        order: [['created_at', 'DESC']],
        limit,
        offset
      });

      res.json({
        success: true,
        data: {
          profiles: rows,
          total: count,
          page,
          totalPages: Math.ceil(count / limit) || 1
        }
      });
    } catch (error) {
      console.error('Admin get pet mating profiles error:', error);
      res.status(500).json({ success: false, message: 'Failed to load pet mating profiles' });
    }
  }

  async adminUpdateStatus(req, res) {
    try {
      const profile = await db.PetMatingProfile.findByPk(req.params.id);
      if (!profile) {
        return res.status(404).json({ success: false, message: 'Pet mating profile not found' });
      }

      const payload = buildPayload(req.body, profile);
      await profile.update(payload);
      res.json({ success: true, message: 'Pet mating profile updated', data: { profile } });
    } catch (error) {
      console.error('Admin update pet mating profile error:', error);
      res.status(500).json({ success: false, message: 'Failed to update profile' });
    }
  }

  async adminGetReports(req, res) {
    try {
      const reports = await db.PetMatingReport.findAll({
        include: [
          { model: db.PetMatingProfile, as: 'profile' },
          { model: db.User, as: 'reporter', attributes: ['id', 'full_name', 'phone_number'] }
        ],
        order: [['created_at', 'DESC']],
        limit: 100
      });

      res.json({ success: true, data: { reports } });
    } catch (error) {
      console.error('Admin get pet mating reports error:', error);
      res.status(500).json({ success: false, message: 'Failed to load pet mating reports' });
    }
  }
}

module.exports = new PetMatingController();
