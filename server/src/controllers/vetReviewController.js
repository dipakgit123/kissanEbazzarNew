const { VetReview, Veterinarian, User } = require('../models');
const { Op } = require('sequelize');

// Create a review for a veterinarian
exports.createReview = async (req, res) => {
  try {
    const { veterinarian_id, rating, review_text, service_type } = req.body;
    const user_id = req.user.id;

    // Check if veterinarian exists and is verified
    const veterinarian = await Veterinarian.findByPk(veterinarian_id);
    if (!veterinarian) {
      return res.status(404).json({
        success: false,
        message: 'Veterinarian not found'
      });
    }

    if (veterinarian.verification_status !== 'verified') {
      return res.status(400).json({
        success: false,
        message: 'Cannot review an unverified veterinarian'
      });
    }

    // Check if user already reviewed this veterinarian
    const existingReview = await VetReview.findOne({
      where: { veterinarian_id, user_id }
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this veterinarian. You can update your existing review.'
      });
    }

    // Create the review
    const review = await VetReview.create({
      veterinarian_id,
      user_id,
      rating,
      review_text,
      service_type
    });

    // Update veterinarian's average rating
    await updateVetAverageRating(veterinarian_id);

    // Fetch the review with user details
    const reviewWithUser = await VetReview.findByPk(review.id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'full_name', 'profile_photo']
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: reviewWithUser
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit review',
      error: error.message
    });
  }
};

// Get reviews for a veterinarian
exports.getVetReviews = async (req, res) => {
  try {
    const { veterinarianId } = req.params;
    const { page = 1, limit = 10, sort = 'newest' } = req.query;

    const offset = (page - 1) * limit;

    let order = [['created_at', 'DESC']];
    if (sort === 'oldest') {
      order = [['created_at', 'ASC']];
    } else if (sort === 'highest') {
      order = [['rating', 'DESC'], ['created_at', 'DESC']];
    } else if (sort === 'lowest') {
      order = [['rating', 'ASC'], ['created_at', 'DESC']];
    } else if (sort === 'helpful') {
      order = [['helpful_count', 'DESC'], ['created_at', 'DESC']];
    }

    const { count, rows: reviews } = await VetReview.findAndCountAll({
      where: {
        veterinarian_id: veterinarianId,
        is_visible: true
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'full_name', 'profile_photo']
      }],
      order,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Calculate rating distribution
    const ratingDistribution = await VetReview.findAll({
      where: {
        veterinarian_id: veterinarianId,
        is_visible: true
      },
      attributes: [
        'rating',
        [require('sequelize').fn('COUNT', require('sequelize').col('rating')), 'count']
      ],
      group: ['rating']
    });

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingDistribution.forEach(item => {
      distribution[item.rating] = parseInt(item.dataValues.count);
    });

    res.json({
      success: true,
      data: {
        reviews,
        ratingDistribution: distribution,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get vet reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: error.message
    });
  }
};

// Update user's own review
exports.updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, review_text, service_type } = req.body;
    const user_id = req.user.id;

    const review = await VetReview.findOne({
      where: { id: reviewId, user_id }
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or you are not authorized to update it'
      });
    }

    await review.update({
      rating,
      review_text,
      service_type
    });

    // Update veterinarian's average rating
    await updateVetAverageRating(review.veterinarian_id);

    const updatedReview = await VetReview.findByPk(reviewId, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'full_name', 'profile_photo']
      }]
    });

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: updatedReview
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update review',
      error: error.message
    });
  }
};

// Delete user's own review
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const user_id = req.user.id;

    const review = await VetReview.findOne({
      where: { id: reviewId, user_id }
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or you are not authorized to delete it'
      });
    }

    const veterinarianId = review.veterinarian_id;
    await review.destroy();

    // Update veterinarian's average rating
    await updateVetAverageRating(veterinarianId);

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete review',
      error: error.message
    });
  }
};

// Get user's review for a specific veterinarian
exports.getUserReview = async (req, res) => {
  try {
    const { veterinarianId } = req.params;
    const user_id = req.user.id;

    const review = await VetReview.findOne({
      where: {
        veterinarian_id: veterinarianId,
        user_id
      }
    });

    res.json({
      success: true,
      data: review
    });
  } catch (error) {
    console.error('Get user review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your review',
      error: error.message
    });
  }
};

// Mark review as helpful
exports.markHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await VetReview.findByPk(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    await review.increment('helpful_count');

    res.json({
      success: true,
      message: 'Marked as helpful',
      data: { helpful_count: review.helpful_count + 1 }
    });
  } catch (error) {
    console.error('Mark helpful error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark review as helpful',
      error: error.message
    });
  }
};

// Veterinarian responds to a review
exports.respondToReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { response } = req.body;
    const vet_id = req.veterinarian.id;

    const review = await VetReview.findOne({
      where: {
        id: reviewId,
        veterinarian_id: vet_id
      }
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or you are not authorized to respond'
      });
    }

    await review.update({
      vet_response: response,
      vet_response_at: new Date()
    });

    res.json({
      success: true,
      message: 'Response added successfully',
      data: review
    });
  } catch (error) {
    console.error('Respond to review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to respond to review',
      error: error.message
    });
  }
};

// Helper function to update veterinarian's average rating
async function updateVetAverageRating(veterinarianId) {
  const result = await VetReview.findOne({
    where: {
      veterinarian_id: veterinarianId,
      is_visible: true
    },
    attributes: [
      [require('sequelize').fn('AVG', require('sequelize').col('rating')), 'avgRating'],
      [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'totalReviews']
    ]
  });

  const avgRating = parseFloat(result.dataValues.avgRating) || 0;
  const totalReviews = parseInt(result.dataValues.totalReviews) || 0;

  await Veterinarian.update(
    {
      rating: Math.round(avgRating * 10) / 10,
      total_reviews: totalReviews
    },
    { where: { id: veterinarianId } }
  );
}
