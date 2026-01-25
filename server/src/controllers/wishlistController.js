const { Wishlist, AnimalListing, BuffaloListing, HorseListing, GoatListing, CatListing, DogListing, OtherAnimalListing } = require('../models');

// Map animal types to their respective models
const animalModels = {
  cow: AnimalListing,
  buffalo: BuffaloListing,
  horse: HorseListing,
  goat: GoatListing,
  cat: CatListing,
  dog: DogListing,
  other: OtherAnimalListing
};

// Get all wishlist items for a user
exports.getWishlist = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all wishlist entries for the user
    const wishlistItems = await Wishlist.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']]
    });

    // Fetch complete animal details for each wishlist item
    const wishlistWithDetails = await Promise.all(
      wishlistItems.map(async (item) => {
        const Model = animalModels[item.animal_type];
        
        if (!Model) {
          console.error(`Unknown animal type: ${item.animal_type}`);
          return null;
        }

        try {
          const animal = await Model.findByPk(item.animal_id);
          
          if (!animal) {
            // Animal no longer exists, remove from wishlist
            await item.destroy();
            return null;
          }

          return {
            wishlist_id: item.id,
            animal_type: item.animal_type,
            animal_id: item.animal_id,
            added_at: item.created_at,
            ...animal.toJSON()
          };
        } catch (error) {
          console.error(`Error fetching animal ${item.animal_type}:${item.animal_id}:`, error);
          return null;
        }
      })
    );

    // Filter out null entries (deleted animals)
    const validWishlist = wishlistWithDetails.filter(item => item !== null);

    res.json({
      success: true,
      count: validWishlist.length,
      wishlist: validWishlist
    });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching wishlist',
      error: error.message
    });
  }
};

// Add item to wishlist
exports.addToWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { animal_type, animal_id } = req.body;

    // Validate animal type
    if (!animalModels[animal_type]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid animal type'
      });
    }

    // Check if animal exists
    const Model = animalModels[animal_type];
    const animal = await Model.findByPk(animal_id);

    if (!animal) {
      return res.status(404).json({
        success: false,
        message: 'Animal not found'
      });
    }

    // Check if already in wishlist
    const existing = await Wishlist.findOne({
      where: {
        user_id: userId,
        animal_type,
        animal_id
      }
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        message: 'Animal already in wishlist',
        wishlist_item: existing
      });
    }

    // Add to wishlist
    const wishlistItem = await Wishlist.create({
      user_id: userId,
      animal_type,
      animal_id
    });

    res.status(201).json({
      success: true,
      message: 'Added to wishlist',
      wishlist_item: wishlistItem
    });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding to wishlist',
      error: error.message
    });
  }
};

// Remove item from wishlist
exports.removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { animal_type, animal_id } = req.body;

    const deleted = await Wishlist.destroy({
      where: {
        user_id: userId,
        animal_type,
        animal_id
      }
    });

    if (deleted === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in wishlist'
      });
    }

    res.json({
      success: true,
      message: 'Removed from wishlist'
    });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing from wishlist',
      error: error.message
    });
  }
};

// Check if item is in wishlist
exports.checkWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { animal_type, animal_id } = req.query;

    const exists = await Wishlist.findOne({
      where: {
        user_id: userId,
        animal_type,
        animal_id
      }
    });

    res.json({
      success: true,
      in_wishlist: !!exists
    });
  } catch (error) {
    console.error('Error checking wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking wishlist',
      error: error.message
    });
  }
};

// Clear entire wishlist
exports.clearWishlist = async (req, res) => {
  try {
    const userId = req.user.id;

    const deleted = await Wishlist.destroy({
      where: { user_id: userId }
    });

    res.json({
      success: true,
      message: 'Wishlist cleared',
      deleted_count: deleted
    });
  } catch (error) {
    console.error('Error clearing wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing wishlist',
      error: error.message
    });
  }
};
