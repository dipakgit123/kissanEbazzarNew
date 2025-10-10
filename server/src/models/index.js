'use strict';

const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
require('dotenv').config();

const db = {};

let sequelize;
if (process.env.DATABASE_URL) {
  // Use DATABASE_URL for Neon
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
  sequelize = new Sequelize(config.database, config.username, config.password, {
    ...config,
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  });
}

// Read and load all model files
fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    try {
      const modelDefiner = require(path.join(__dirname, file));
      if (typeof modelDefiner === 'function') {
        const model = modelDefiner(sequelize, DataTypes);
        db[model.name] = model;
        console.log(`✓ Loaded model: ${model.name}`);
      }
    } catch (error) {
      console.error(`✗ Error loading model ${file}:`, error.message);
    }
  });

// Set up associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
    console.log(`✓ Associations set for: ${modelName}`);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;