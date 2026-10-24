'use strict';
const { sequelize } = require('../models');
const connectDB = async () => {
  await sequelize.authenticate();
  console.log('PostgreSQL connected successfully');
  if (process.env.DB_SYNC_ON_START === 'true') {
    if (process.env.NODE_ENV === 'production') throw new Error('Use migrations in production; disable DB_SYNC_ON_START');
    await sequelize.sync();
  }
};
module.exports = { sequelize, connectDB };
