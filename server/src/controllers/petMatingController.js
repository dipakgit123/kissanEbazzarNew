'use strict';

const { Op } = require('sequelize');
const db = require('../models');
const { validateProfile, pagination, invalid } = require('../utils/petMatingValidation');
const PUBLIC_EXCLUDE = ['owner_phone', 'admin_notes', 'photo_public_ids', 'video_public_id', 'latitude', 'longitude'];
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

const getOwnerInclude = (privateContact = false) => ([{
  model: db.User,
  as: 'owner',
  attributes: ['id', 'full_name', 'city', 'state', 'profile_photo', ...(privateContact ? ['phone_number'] : [])]
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
    where[Op.and] = [{ [Op.or]: [{ available_to: null }, { available_to: { [Op.gte]: new Date().toISOString().slice(0, 10) } }] }];
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

const buildPayload = (body = {}, existing = null, admin = false) => {
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
      if (field !== 'admin_notes' || admin) payload[field] = cleanString(body[field]);
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

  if (body.status !== undefined && (admin ? VALID_STATUSES : ['active', 'paused', 'matched']).includes(body.status) && (admin || !existing || !['pending', 'rejected', 'removed'].includes(existing.status))) {
    payload.status = body.status;
    payload.published_at = body.status === 'active' ? existing?.published_at || new Date() : existing?.published_at;
  }

  if (body.animal_profile_id !== undefined) payload.animal_profile_id = cleanNumber(body.animal_profile_id);
  else if (existing && body.pet_type && body.pet_type !== existing.pet_type) payload.animal_profile_id = null;
  if (body.age_months !== undefined) payload.age_months = cleanNumber(body.age_months);
  if (body.weight_kg !== undefined) payload.weight_kg = cleanNumber(body.weight_kg);
  if (body.fee_amount !== undefined) payload.fee_amount = cleanNumber(body.fee_amount);
  if (body.latitude !== undefined) payload.latitude = cleanNumber(body.latitude);
  if (body.longitude !== undefined) payload.longitude = cleanNumber(body.longitude);
  if (body.pedigree_available !== undefined) payload.pedigree_available = parseBoolean(body.pedigree_available);
  if (admin && body.is_featured !== undefined) payload.is_featured = parseBoolean(body.is_featured);

  return payload;
};

const uploadProfileMedia = async (files = {}) => {
  const payload = {};
  const photoFiles = files.photos || [];
  const videoFile = files.video?.[0];

  if (photoFiles.length > 0) {
    const uploads = await Promise.all(
      photoFiles.map((file) => uploadToCloudinary(file, 'pet-mating/photos', 'image'))
    );
    payload.photos = uploads.map((item) => item.secure_url);
    payload.photo_public_ids = uploads.map((item) => item.public_id);
  }

  if (videoFile) {
    const upload = await uploadToCloudinary(videoFile, 'pet-mating/videos', 'video');
    payload.video_url = upload.secure_url;
    payload.video_public_id = upload.public_id;
  }

  return payload;
};

class PetMatingController {
  async getProfiles(req, res) {
    try {
      const { page, limit, offset } = pagination(req.query);
      const where = buildWhere(req.query, false);
      if (req.user?.id) {
        where.user_id = { [Op.ne]: req.user.id };
      }

      const { count, rows } = await db.PetMatingProfile.findAndCountAll({
        attributes: { exclude: PUBLIC_EXCLUDE },
        where,
        include: getOwnerInclude(),
        order: [['is_featured', 'DESC'], ['published_at', 'DESC'], ['created_at', 'DESC'], ['id', 'DESC']],
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
      res.status(error.status || 500).json({ success: false, fields: error.fields, message: error.status ? error.message : 'Failed to load pet mating profiles' });
    }
  }

  async getProfileById(req, res) {
    try {
      const profile = await db.PetMatingProfile.findOne({
        where: { id: req.params.id, ...buildWhere({}, false) },
        attributes: { exclude: PUBLIC_EXCLUDE },
        include: getOwnerInclude()
      });

      if (!profile) {
        return res.status(404).json({ success: false, message: 'Pet mating profile not found' });
      }

      await profile.increment('views', { returning: false });
      await profile.reload({ include: getOwnerInclude(), attributes: { exclude: PUBLIC_EXCLUDE } });

      const publicProfile = profile.toJSON();
      for (const key of PUBLIC_EXCLUDE) delete publicProfile[key];
      res.json({ success: true, data: { profile: publicProfile } });
    } catch (error) {
      console.error('Get pet mating profile error:', error);
      res.status(error.status || 500).json({ success: false, fields: error.fields, message: 'Failed to load pet mating profile' });
    }
  }

  async getMyProfiles(req, res) {
    try {
      const profiles = await db.PetMatingProfile.findAll({
        where: { user_id: req.user.id, status: { [Op.ne]: 'removed' } },
        order: [['created_at', 'DESC']]
      });

      res.json({ success: true, data: { profiles } });
    } catch (error) {
      console.error('Get my pet mating profiles error:', error);
      res.status(error.status || 500).json({ success: false, fields: error.fields, message: 'Failed to load your pet mating profiles' });
    }
  }

  async createProfile(req, res) {
    try {
      const ownerPhone = validateProfile(req.body);
      const payload = buildPayload(req.body);
      payload.owner_phone = ownerPhone;
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
      res.status(error.status || 500).json({ success: false, fields: error.fields, message: error.status ? error.message : 'Failed to create pet mating profile' });
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

      if (['removed', 'rejected', 'pending'].includes(profile.status)) return res.status(409).json({ success: false, message: 'This profile cannot be edited in its current status' });
      const ownerPhone = validateProfile(req.body, profile);
      const payload = buildPayload(req.body, profile);
      payload.owner_phone = ownerPhone;
      const oldPhotoIds = [...(profile.photo_public_ids || [])], oldVideoId = profile.video_public_id;
      const mediaPayload = await uploadProfileMedia(req.files || {});
      if (parseBoolean(req.body.remove_video) && !mediaPayload.video_url) { mediaPayload.video_url = null; mediaPayload.video_public_id = null; }
      await profile.update({ ...payload, ...mediaPayload });
      if (mediaPayload.photos) await Promise.all(oldPhotoIds.map(id => deleteFromCloudinary(id, 'image').catch(() => null)));
      if (oldVideoId && ('video_url' in mediaPayload)) await deleteFromCloudinary(oldVideoId, 'video').catch(() => null);

      res.json({ success: true, message: 'Pet mating profile updated successfully', data: { profile } });
    } catch (error) {
      console.error('Update pet mating profile error:', error);
      res.status(error.status || 500).json({ success: false, fields: error.fields, message: error.status ? error.message : 'Failed to update pet mating profile' });
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
      res.status(error.status || 500).json({ success: false, fields: error.fields, message: 'Failed to remove pet mating profile' });
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

      if (!['active', 'paused', 'matched'].includes(profile.status)) {
        return res.status(409).json({ success: false, message: 'This profile is not approved for matching' });
      }
      await profile.update({ status: 'matched' });
      res.json({ success: true, message: 'Pet mating profile marked as matched', data: { profile } });
    } catch (error) {
      console.error('Mark pet mating matched error:', error);
      res.status(error.status || 500).json({ success: false, fields: error.fields, message: 'Failed to update pet mating profile' });
    }
  }

  async trackContact(req, res) {
    try {
      const profile = await db.PetMatingProfile.findOne({where:{id:req.params.id, ...buildWhere({}, false)}, include:getOwnerInclude(true)});
      if (!profile) {
        return res.status(404).json({ success: false, message: 'Pet mating profile not found' });
      }

      if (String(profile.user_id) === String(req.user.id)) {
        return res.status(400).json({ success: false, message: 'You cannot contact your own mating profile' });
      }

      const phone = profile.owner_phone || profile.owner?.phone_number;
      if (!phone) return res.status(409).json({success:false,message:'Contact number is not available'});
      await profile.increment('contact_count');
      res.json({
        success: true,
        data: {
          owner_phone: phone,
          owner_name: profile.owner_name
        }
      });
    } catch (error) {
      console.error('Track pet mating contact error:', error);
      res.status(error.status || 500).json({ success: false, fields: error.fields, message: 'Failed to track contact' });
    }
  }

  async updateStatus(req, res) {
    try {
      const status = req.body.status;
      if (!['active', 'paused', 'matched'].includes(status)) invalid('status', 'Choose active, paused or matched');
      const profile = await db.PetMatingProfile.findOne({where:{id:req.params.id,user_id:req.user.id}});
      if (!profile) return res.status(404).json({success:false,message:'Pet mating profile not found'});
      if (!['active','paused','matched'].includes(profile.status)) return res.status(409).json({success:false,message:'This profile cannot be reactivated'});
      if (status === 'active' && profile.available_to && profile.available_to < new Date().toISOString().slice(0,10)) invalid('available_to','Update the expired availability before reactivating');
      await profile.update({status});
      res.json({success:true,data:{profile}});
    } catch (error) { res.status(error.status || 500).json({success:false,fields:error.fields,message:error.status ? error.message : 'Unable to update status'}); }
  }

  async reportProfile(req, res) {
    try {
      if (!VALID_REPORT_REASONS.includes(req.body.reason)) invalid('reason','Choose a report reason');
      const description = cleanString(req.body.description);
      if (!description || description.length < 5 || description.length > 2000) invalid('description','Describe the concern in 5 to 2000 characters');
      const result = await db.sequelize.transaction(async transaction => {
        const profile = await db.PetMatingProfile.findByPk(req.params.id, {transaction,lock:transaction.LOCK.UPDATE});
        if (!profile || profile.status !== 'active') return {code:404,message:'Pet mating profile not found'};
        if (String(profile.user_id) === String(req.user.id)) return {code:400,message:'You cannot report your own mating profile'};
        const previous = await db.PetMatingReport.findOne({where:{profile_id:profile.id,reporter_id:req.user.id,status:'open'},transaction});
        if (previous) return {code:409,message:'You already have an open report for this profile'};
        const report = await db.PetMatingReport.create({profile_id:profile.id,reporter_id:req.user.id,reason:req.body.reason,description},{transaction});
        await profile.increment('report_count',{transaction});
        return {code:201,report};
      });
      res.status(result.code).json({success:result.code===201,message:result.message || 'Profile reported for review',data:result.report ? {report:result.report} : undefined});
    } catch (error) { res.status(error.status || 500).json({success:false,fields:error.fields,message:error.status ? error.message : 'Failed to report profile'}); }
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
      res.status(error.status || 500).json({ success: false, fields: error.fields, message: error.status ? error.message : 'Failed to load pet mating profiles' });
    }
  }

  async adminUpdateStatus(req, res) {
    try {
      const profile = await db.PetMatingProfile.findByPk(req.params.id);
      if (!profile) {
        return res.status(404).json({ success: false, message: 'Pet mating profile not found' });
      }

      const payload = buildPayload(req.body, profile, true);
      await profile.update(payload);
      res.json({ success: true, message: 'Pet mating profile updated', data: { profile } });
    } catch (error) {
      console.error('Admin update pet mating profile error:', error);
      res.status(error.status || 500).json({ success: false, fields: error.fields, message: 'Failed to update profile' });
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
      res.status(error.status || 500).json({ success: false, fields: error.fields, message: 'Failed to load pet mating reports' });
    }
  }
}

module.exports = new PetMatingController();
