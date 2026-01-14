// src/migrations/20241215000005-add-views-to-workout-videos.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add views column only
    await queryInterface.addColumn('workout_videos', 'views', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Number of times the video has been viewed for analytics'
    });
    
    console.log('✅ Added views column to workout_videos table for analytics tracking');
  },

  async down(queryInterface, Sequelize) {
    // Remove the views column
    await queryInterface.removeColumn('workout_videos', 'views');
    
    console.log('🗑️  Removed views column from workout_videos table');
  }
};