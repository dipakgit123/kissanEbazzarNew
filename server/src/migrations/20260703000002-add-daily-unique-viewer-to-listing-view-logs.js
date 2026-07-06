'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('listing_view_logs', 'view_date', {
      type: Sequelize.DATEONLY,
      allowNull: true
    });

    await queryInterface.addColumn('listing_view_logs', 'viewer_key', {
      type: Sequelize.STRING(140),
      allowNull: true
    });

    await queryInterface.sequelize.query(`
      UPDATE listing_view_logs
      SET
        view_date = DATE(created_at AT TIME ZONE 'Asia/Kolkata'),
        viewer_key = COALESCE(
          'user:' || viewer_id::text,
          'ip:' || NULLIF(viewer_ip, ''),
          'legacy:' || id::text
        )
      WHERE view_date IS NULL OR viewer_key IS NULL;
    `);

    await queryInterface.sequelize.query(`
      DELETE FROM listing_view_logs duplicate
      USING listing_view_logs original
      WHERE duplicate.id > original.id
        AND duplicate.listing_id = original.listing_id
        AND duplicate.listing_type = original.listing_type
        AND duplicate.view_date = original.view_date
        AND duplicate.viewer_key = original.viewer_key;
    `);

    await queryInterface.changeColumn('listing_view_logs', 'view_date', {
      type: Sequelize.DATEONLY,
      allowNull: false
    });

    await queryInterface.changeColumn('listing_view_logs', 'viewer_key', {
      type: Sequelize.STRING(140),
      allowNull: false
    });

    await queryInterface.addIndex('listing_view_logs', ['view_date']);
    await queryInterface.addIndex(
      'listing_view_logs',
      ['listing_id', 'listing_type', 'view_date', 'viewer_key'],
      {
        unique: true,
        name: 'listing_view_logs_unique_daily_viewer'
      }
    );
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('listing_view_logs', 'listing_view_logs_unique_daily_viewer');
    await queryInterface.removeIndex('listing_view_logs', ['view_date']);
    await queryInterface.removeColumn('listing_view_logs', 'viewer_key');
    await queryInterface.removeColumn('listing_view_logs', 'view_date');
  }
};
