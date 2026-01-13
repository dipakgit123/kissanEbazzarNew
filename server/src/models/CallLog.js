'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class CallLog extends Model {
    static associate(models) {
      // Association with User model (Caller)
      CallLog.belongsTo(models.User, {
        foreignKey: 'caller_id',
        as: 'caller'
      });

      // Association with User model (Receiver)
      CallLog.belongsTo(models.User, {
        foreignKey: 'receiver_id',
        as: 'receiver'
      });

      // Association with Veterinarian model
      CallLog.belongsTo(models.Veterinarian, {
        foreignKey: 'veterinarian_id',
        as: 'veterinarian'
      });
    }

    // Get call with full details
    async getWithDetails() {
      return await CallLog.findByPk(this.id, {
        include: [
          {
            model: sequelize.models.User,
            as: 'caller',
            attributes: ['id', 'full_name', 'phone_number', 'city', 'state']
          },
          {
            model: sequelize.models.User,
            as: 'receiver',
            attributes: ['id', 'full_name', 'phone_number', 'city', 'state']
          },
          {
            model: sequelize.models.Veterinarian,
            as: 'veterinarian',
            attributes: ['id', 'full_name', 'specialization', 'clinic_name']
          }
        ]
      });
    }
  }

  CallLog.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },

    // Caller Information
    callerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'caller_id'
    },

    // Receiver Information
    receiverId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'receiver_id'
    },

    // Call Context
    callType: {
      type: DataTypes.ENUM('animal_listing', 'veterinarian', 'direct'),
      allowNull: false,
      defaultValue: 'direct',
      field: 'call_type'
    },

    listingId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'listing_id'
    },

    listingType: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'listing_type'
    },

    veterinarianId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'veterinarian_id'
    },

    // Call Details
    receiverPhoneNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'receiver_phone_number'
    },

    callDuration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'call_duration'
    },

    callStatus: {
      type: DataTypes.ENUM('initiated', 'answered', 'missed', 'busy', 'failed'),
      allowNull: false,
      defaultValue: 'initiated',
      field: 'call_status'
    },

    // Location Information
    callerLatitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
      field: 'caller_latitude'
    },

    callerLongitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
      field: 'caller_longitude'
    },

    // Metadata
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'user_agent'
    },

    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'created_at'
    },

    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'updated_at'
    }
  }, {
    sequelize,
    modelName: 'CallLog',
    tableName: 'call_logs',
    timestamps: true,
    underscored: true
  });

  // Class methods

  // Get call logs for a user (both made and received)
  CallLog.getUserCallLogs = async function(userId, options = {}) {
    const { limit = 50, offset = 0 } = options;

    return await this.findAll({
      where: {
        [sequelize.Sequelize.Op.or]: [
          { caller_id: userId },
          { receiver_id: userId }
        ]
      },
      include: [
        {
          model: sequelize.models.User,
          as: 'caller',
          attributes: ['id', 'full_name', 'phone_number']
        },
        {
          model: sequelize.models.User,
          as: 'receiver',
          attributes: ['id', 'full_name', 'phone_number']
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });
  };

  // Get calls made by a user
  CallLog.getCallsMade = async function(userId, options = {}) {
    const { limit = 50, offset = 0 } = options;

    return await this.findAll({
      where: { caller_id: userId },
      include: [
        {
          model: sequelize.models.User,
          as: 'receiver',
          attributes: ['id', 'full_name', 'phone_number']
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });
  };

  // Get calls received by a user
  CallLog.getCallsReceived = async function(userId, options = {}) {
    const { limit = 50, offset = 0 } = options;

    return await this.findAll({
      where: { receiver_id: userId },
      include: [
        {
          model: sequelize.models.User,
          as: 'caller',
          attributes: ['id', 'full_name', 'phone_number']
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });
  };

  // Get call statistics for a user
  CallLog.getUserStats = async function(userId) {
    const callsMade = await this.count({
      where: { caller_id: userId }
    });

    const callsReceived = await this.count({
      where: { receiver_id: userId }
    });

    const recentCalls = await this.count({
      where: {
        [sequelize.Sequelize.Op.or]: [
          { caller_id: userId },
          { receiver_id: userId }
        ],
        created_at: {
          [sequelize.Sequelize.Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    });

    return {
      callsMade,
      callsReceived,
      totalCalls: callsMade + callsReceived,
      recentCallsLast7Days: recentCalls
    };
  };

  // Get calls for a specific listing
  CallLog.getListingCalls = async function(listingId, listingType) {
    return await this.findAll({
      where: {
        listing_id: listingId,
        listing_type: listingType
      },
      include: [
        {
          model: sequelize.models.User,
          as: 'caller',
          attributes: ['id', 'full_name', 'phone_number']
        }
      ],
      order: [['created_at', 'DESC']]
    });
  };

  return CallLog;
};
