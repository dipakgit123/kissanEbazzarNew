const { Sequelize } = require('sequelize');
require('dotenv').config();

const env = process.env.NODE_ENV || 'development';
const config = require('./config.json')[env];

let sequelize;

// For Neon PostgreSQL, we can use either DATABASE_URL or individual parameters
if (process.env.DATABASE_URL) {
  // Use connection string for Neon
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: env === 'development' ? console.log : false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  });
} else if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  // Use individual parameters from config.json
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    {
      host: config.host,
      port: config.port || 5432,
      dialect: config.dialect || 'postgres',
      logging: config.logging === false ? false : console.log,
      dialectOptions: config.dialectOptions || {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      },
      pool: config.pool || {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      define: {
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
      }
    }
  );
}

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✓ Neon PostgreSQL connected successfully');
    
    // Sync models with database
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('✓ Database synchronized');
    }
  } catch (error) {
    console.error('✗ Unable to connect to Neon database:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };