// migrations/[timestamp]-add-details-to-activity-history.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add the details column
    await queryInterface.addColumn('activity_history', 'details', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: {}
    });

    // If you also need to add program_id (based on your code usage), add it too:
    await queryInterface.addColumn('activity_history', 'program_id', {
      type: Sequelize.UUID,
      allowNull: true, // Set to false after data migration
      references: {
        model: 'programs',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // Update existing records to set program_id
    // This is a data migration that requires a JOIN with workout_videos
    await queryInterface.sequelize.query(`
      UPDATE activity_history ah
      SET program_id = wv.program_id
      FROM workout_videos wv
      WHERE ah.workout_video_id = wv.id
      AND ah.program_id IS NULL;
    `);

    // After data migration, make program_id NOT NULL
    await queryInterface.changeColumn('activity_history', 'program_id', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'programs',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // Add index for program_id
    await queryInterface.addIndex('activity_history', ['program_id']);
  },

  async down(queryInterface, Sequelize) {
    // Remove the details column
    await queryInterface.removeColumn('activity_history', 'details');
    
    // Remove program_id column
    await queryInterface.removeColumn('activity_history', 'program_id');
  }
};