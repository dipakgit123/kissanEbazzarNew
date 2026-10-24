'use strict';
module.exports = (sequelize, DataTypes) => sequelize.define('VetReviewHelpfulVote', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  review_id: { type: DataTypes.INTEGER, allowNull: false },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
}, { tableName: 'vet_review_helpful_votes', timestamps: false, indexes: [{ unique: true, fields: ['review_id', 'user_id'] }] });
