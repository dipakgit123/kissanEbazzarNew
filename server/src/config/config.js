'use strict';

const envConfig = {
  use_env_variable: 'DATABASE_URL',
  dialect: 'postgres',
  dialectOptions: {
    ssl: process.env.DB_SSL === 'false' ? false : {
      require: true,
      rejectUnauthorized: process.env.NODE_ENV === 'production' || process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
      ...(process.env.DB_SSL_CA ? { ca: process.env.DB_SSL_CA.replace(/\\n/g, '\n') } : {})
    }
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};

module.exports = {
  development: {
    ...envConfig,
    logging: true
  },
  test: {
    ...envConfig,
    logging: false
  },
  production: {
    ...envConfig,
    logging: false,
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000
    }
  }
};
