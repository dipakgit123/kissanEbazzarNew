'use strict';

module.exports = (sequelize, DataTypes) => {
  const Appointment = sequelize.define('Appointment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    veterinarian_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'veterinarians',
        key: 'id'
      }
    },
    animal_type: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Type of animal (cow, buffalo, goat, etc.)'
    },
    animal_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    animal_age: {
      type: DataTypes.STRING,
      allowNull: true
    },
    animal_breed: {
      type: DataTypes.STRING,
      allowNull: true
    },
    appointment_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    appointment_time: {
      type: DataTypes.TIME,
      allowNull: false
    },
    appointment_type: {
      type: DataTypes.ENUM('consultation', 'emergency', 'vaccination', 'surgery', 'checkup', 'other'),
      defaultValue: 'consultation'
    },
    symptoms: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Description of symptoms or reason for appointment'
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed', 'no-show'),
      defaultValue: 'pending'
    },
    contact_preference: {
      type: DataTypes.ENUM('call', 'visit', 'both'),
      defaultValue: 'both',
      comment: 'How user wants to be contacted'
    },
    farmer_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    farmer_phone: {
      type: DataTypes.STRING,
      allowNull: false
    },
    farmer_address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    farmer_latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true
    },
    farmer_longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true
    },
    consultation_fee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Fee charged for this appointment'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Additional notes from farmer'
    },
    vet_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Notes added by veterinarian'
    },
    cancelled_by: {
      type: DataTypes.ENUM('user', 'veterinarian', 'system'),
      allowNull: true
    },
    cancellation_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    cancelled_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    confirmed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    reminder_sent_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'appointments',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['veterinarian_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['appointment_date']
      }
    ]
  });

  Appointment.associate = function(models) {
    Appointment.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
    Appointment.belongsTo(models.Veterinarian, {
      foreignKey: 'veterinarian_id',
      as: 'veterinarian'
    });
  };

  return Appointment;
};
