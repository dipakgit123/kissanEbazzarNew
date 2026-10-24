'use strict';

module.exports = {
  async up(q, S) {
    await q.sequelize.transaction(async transaction => {
      const options = { transaction };
      for (const table of ['pregnancy_records', 'other_animal_listings', 'ai_health_reports', 'wishlists']) {
        await q.addColumn(table, 'animal_group', { type: S.STRING(8), allowNull: true }, options);
        await q.addIndex(table, ['animal_group'], options);
      }
      for (const group of ['farm', 'pet']) await q.addColumn('notification_preferences', group + '_enabled', { type: S.BOOLEAN, allowNull: false, defaultValue: true }, options);
      await q.addColumn('blogs', 'audience', { type: S.STRING(16), allowNull: false, defaultValue: 'unassigned' }, options);
      await q.addColumn('veterinarians', 'animal_groups', { type: S.ARRAY(S.STRING(8)), allowNull: false, defaultValue: [] }, options);
      // Leave ambiguous historical "other" and unreviewed editorial records unclassified.
      for (const table of ['pregnancy_records', 'other_animal_listings', 'wishlists']) {
        await q.sequelize.query(`UPDATE ${table} SET animal_group = CASE WHEN lower(animal_type::text) IN ('dog','cat') THEN 'pet' WHEN lower(animal_type::text) IN ('cow','buffalo','goat','sheep','horse','pig','chicken','duck','turkey','camel','donkey','mule') THEN 'farm' ELSE NULL END`, options);
      }
      await q.sequelize.query(`UPDATE ai_health_reports SET animal_group = CASE WHEN context->>'animalType' IN ('dog','cat') THEN 'pet' WHEN context->>'animalType' IN ('cow','buffalo','goat','sheep','horse','pig','chicken','duck','turkey','camel','donkey','mule') THEN 'farm' ELSE NULL END`, options);
      await q.sequelize.query(`UPDATE veterinarians SET animal_groups = ARRAY['farm']::varchar[] WHERE specialization IN ('large_animal','livestock')`, options);
      await q.createTable('animal_profiles', {
        id: { type: S.INTEGER, primaryKey: true, autoIncrement: true },
        user_id: { type: S.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
        animal_group: { type: S.STRING(8), allowNull: false },
        archived: { type: S.BOOLEAN, allowNull: false, defaultValue: false },
        species: { type: S.STRING(50), allowNull: false },
        name: { type: S.STRING(100), allowNull: false },
        tag: { type: S.STRING(100) },
        breed: { type: S.STRING(100) },
        farmer_cow_id: { type: S.INTEGER, unique: true, references: { model: 'farmer_cows', key: 'id' }, onDelete: 'SET NULL' },
        created_at: { type: S.DATE, allowNull: false }, updated_at: { type: S.DATE, allowNull: false }
      }, options);
      await q.addIndex('animal_profiles', ['user_id', 'animal_group'], options);
      for (const table of ['pregnancy_records', 'ai_health_reports', 'pet_mating_profiles']) await q.addColumn(table, 'animal_profile_id', { type: S.INTEGER, allowNull: true, references: { model: 'animal_profiles', key: 'id' }, onDelete: 'SET NULL' }, options);
      await q.sequelize.query(`INSERT INTO animal_profiles (user_id, animal_group, species, name, tag, breed, farmer_cow_id, created_at, updated_at) SELECT user_id, 'farm', animal_type::text, cow_name, cow_tag, breed_name, id, created_at, updated_at FROM farmer_cows`, options);
    });
  },
  async down(q) {
    await q.sequelize.transaction(async transaction => {
      const options = { transaction };
      for (const group of ['farm', 'pet']) await q.removeColumn('notification_preferences', group + '_enabled', options);
      for (const table of ['pregnancy_records', 'ai_health_reports', 'pet_mating_profiles']) await q.removeColumn(table, 'animal_profile_id', options);
      await q.dropTable('animal_profiles', options);
      await q.removeColumn('veterinarians', 'animal_groups', options);
      await q.removeColumn('blogs', 'audience', options);
      for (const table of ['pregnancy_records', 'other_animal_listings', 'ai_health_reports', 'wishlists']) await q.removeColumn(table, 'animal_group', options);
    });
  }
};
