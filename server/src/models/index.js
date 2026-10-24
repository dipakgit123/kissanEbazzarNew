'use strict';

const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
require('dotenv').config();
const config = require(path.join(__dirname, '..', 'config', 'config.js'))[env];

const db = {};

const sequelize = config.use_env_variable
  ? new Sequelize(process.env[config.use_env_variable], config)
  : new Sequelize(config.database, config.username, config.password, config);

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

require('../services/animalGroupScope').install(db);
require('../services/notificationEvents').install(db);

module.exports = db;
