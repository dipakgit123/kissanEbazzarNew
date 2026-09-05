const db = require('../src/models');

const run = async () => {
  const [identity] = await db.sequelize.query(`
    SELECT
      current_database() AS database,
      current_schema() AS schema,
      current_user AS db_user,
      inet_server_addr()::text AS server_ip
  `);
  const [tables] = await db.sequelize.query(`
    SELECT
      to_regclass('public.notifications')::text AS notifications,
      to_regclass('public.notification_preferences')::text AS notification_preferences
  `);
  const [columns] = await db.sequelize.query(`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND (
        (table_name = 'device_tokens' AND column_name IN ('recipient_type', 'recipient_id', 'last_seen_at'))
        OR table_name = 'notification_preferences'
      )
    ORDER BY table_name, column_name
  `);
  const [migrationHistory] = await db.sequelize.query(`
    SELECT name
    FROM "SequelizeMeta"
    WHERE name LIKE '20260103%'
       OR name LIKE '20260905%'
    ORDER BY name
  `);
  const [tokenSummary] = await db.sequelize.query(`
    SELECT
      id,
      provider,
      length(token) AS token_length,
      CASE
        WHEN token LIKE 'ExponentPushToken[%' THEN 'expo'
        ELSE 'firebase_like'
      END AS token_shape,
      user_id,
      recipient_id,
      created_at
    FROM device_tokens
    ORDER BY created_at DESC
    LIMIT 5
  `);

  console.log('DATABASE_IDENTITY:', identity[0]);
  console.log('TABLE_CHECK:', tables[0]);
  console.log('NEW_SCHEMA_COLUMNS:', columns);
  console.log('RELEVANT_MIGRATIONS:', migrationHistory);
  console.log('TOKEN_SUMMARY:', tokenSummary);
};

run()
  .catch((error) => {
    console.error('Notification schema check failed:', error.message);
    process.exitCode = 1;
  })
  .finally(() => db.sequelize.close());
