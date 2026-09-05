'use strict';

const addColumnIfMissing = async (queryInterface, tableName, columnName, definition) => {
  const table = await queryInterface.describeTable(tableName);
  if (!table[columnName]) {
    await queryInterface.addColumn(tableName, columnName, definition);
  }
};

const addIndexIfMissing = async (queryInterface, tableName, fields, options) => {
  try {
    await queryInterface.addIndex(tableName, fields, options);
  } catch (error) {
    if (!/already exists|Duplicate key name/i.test(error.message)) {
      throw error;
    }
  }
};

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE notifications
      ALTER COLUMN type DROP DEFAULT;
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE notifications
      ALTER COLUMN type TYPE VARCHAR(80) USING type::text;
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE notifications
      ALTER COLUMN type SET DEFAULT 'system';
    `);

    await addColumnIfMissing(queryInterface, 'notifications', 'recipient_type', {
      type: Sequelize.ENUM('user', 'veterinarian'),
      allowNull: false,
      defaultValue: 'user',
    });
    await addColumnIfMissing(queryInterface, 'notifications', 'recipient_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.sequelize.query(`
      UPDATE notifications
      SET recipient_type = 'user',
          recipient_id = COALESCE(recipient_id, user_id)
      WHERE recipient_id IS NULL;
    `);
    await queryInterface.changeColumn('notifications', 'user_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await addColumnIfMissing(queryInterface, 'device_tokens', 'recipient_type', {
      type: Sequelize.ENUM('user', 'veterinarian'),
      allowNull: false,
      defaultValue: 'user',
    });
    await addColumnIfMissing(queryInterface, 'device_tokens', 'recipient_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.sequelize.query(`
      UPDATE device_tokens
      SET recipient_type = 'user',
          recipient_id = COALESCE(recipient_id, user_id)
      WHERE recipient_id IS NULL;
    `);
    await queryInterface.changeColumn('device_tokens', 'user_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await addIndexIfMissing(queryInterface, 'notifications', ['recipient_type', 'recipient_id'], {
      name: 'notifications_recipient_index',
    });
    await addIndexIfMissing(queryInterface, 'device_tokens', ['recipient_type', 'recipient_id'], {
      name: 'device_tokens_recipient_index',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('device_tokens', 'device_tokens_recipient_index').catch(() => {});
    await queryInterface.removeIndex('notifications', 'notifications_recipient_index').catch(() => {});

    await queryInterface.removeColumn('device_tokens', 'recipient_id').catch(() => {});
    await queryInterface.removeColumn('device_tokens', 'recipient_type').catch(() => {});
    await queryInterface.sequelize.query(`
      DELETE FROM device_tokens WHERE user_id IS NULL;
    `);
    await queryInterface.changeColumn('device_tokens', 'user_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });

    await queryInterface.removeColumn('notifications', 'recipient_id').catch(() => {});
    await queryInterface.removeColumn('notifications', 'recipient_type').catch(() => {});
    await queryInterface.sequelize.query(`
      DELETE FROM notifications WHERE user_id IS NULL;
    `);
    await queryInterface.changeColumn('notifications', 'user_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
    await queryInterface.sequelize.query(`
      UPDATE notifications
      SET type = 'system'
      WHERE type NOT IN ('new_listing', 'price_drop', 'contact', 'reminder', 'pregnancy', 'system');
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE notifications
      ALTER COLUMN type DROP DEFAULT;
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE notifications
      ALTER COLUMN type TYPE enum_notifications_type USING type::enum_notifications_type;
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE notifications
      ALTER COLUMN type SET DEFAULT 'system';
    `);
  },
};
