'use strict';

const addColumnIfMissing = async (queryInterface, tableName, columnName, definition) => {
  const table = await queryInterface.describeTable(tableName);
  if (!table[columnName]) {
    await queryInterface.addColumn(tableName, columnName, definition);
  }
};

module.exports = {
  async up(queryInterface, Sequelize) {
    await addColumnIfMissing(queryInterface, 'notifications', 'dedupe_key', {
      type: Sequelize.STRING(180),
      allowNull: true,
    });
    await queryInterface.addIndex('notifications', ['dedupe_key'], {
      unique: true,
      name: 'notifications_dedupe_key_unique',
    }).catch((error) => {
      if (!/already exists|duplicate/i.test(error.message)) throw error;
    });

    await addColumnIfMissing(queryInterface, 'appointments', 'reminder_sent_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.createTable('notification_preferences', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      recipient_type: {
        type: Sequelize.ENUM('user', 'veterinarian'),
        allowNull: false,
      },
      recipient_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      push_enabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      appointments_enabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      marketplace_enabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      reminders_enabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      communication_enabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      system_enabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex(
      'notification_preferences',
      ['recipient_type', 'recipient_id'],
      { unique: true, name: 'notification_preferences_recipient_unique' }
    );

    await addColumnIfMissing(queryInterface, 'device_tokens', 'device_id', {
      type: Sequelize.STRING(120),
      allowNull: true,
    });
    await addColumnIfMissing(queryInterface, 'device_tokens', 'app_version', {
      type: Sequelize.STRING(40),
      allowNull: true,
    });
    await addColumnIfMissing(queryInterface, 'device_tokens', 'last_seen_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await addColumnIfMissing(queryInterface, 'device_tokens', 'failure_count', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
    await addColumnIfMissing(queryInterface, 'device_tokens', 'last_error', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('device_tokens', 'last_error').catch(() => {});
    await queryInterface.removeColumn('device_tokens', 'failure_count').catch(() => {});
    await queryInterface.removeColumn('device_tokens', 'last_seen_at').catch(() => {});
    await queryInterface.removeColumn('device_tokens', 'app_version').catch(() => {});
    await queryInterface.removeColumn('device_tokens', 'device_id').catch(() => {});
    await queryInterface.dropTable('notification_preferences').catch(() => {});
    await queryInterface.removeColumn('appointments', 'reminder_sent_at').catch(() => {});
    await queryInterface.removeIndex('notifications', 'notifications_dedupe_key_unique').catch(() => {});
    await queryInterface.removeColumn('notifications', 'dedupe_key').catch(() => {});
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_notification_preferences_recipient_type";'
    );
  },
};
