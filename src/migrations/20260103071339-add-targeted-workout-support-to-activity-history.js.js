// migrations/[timestamp]-add-targeted-workout-support-to-activity-history.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // First, check if the ENUM type already exists, if not create it
    const enumExists = await queryInterface.sequelize.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_type 
        WHERE typname = 'enum_activity_history_activity_type'
      );
    `);

    if (!enumExists[0][0].exists) {
      await queryInterface.sequelize.query(`
        CREATE TYPE "enum_activity_history_activity_type" AS ENUM ('PROGRAM_WORKOUT', 'TARGETED_WORKOUT');
      `);
    }

    // Add targeted_workout_id column
    await queryInterface.addColumn('activity_history', 'targeted_workout_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'targeted_workouts',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Add activity_type column
    await queryInterface.addColumn('activity_history', 'activity_type', {
      type: Sequelize.ENUM('PROGRAM_WORKOUT', 'TARGETED_WORKOUT'),
      allowNull: false,
      defaultValue: 'PROGRAM_WORKOUT'
    });

    // Modify existing columns to allow NULL for targeted workouts
    await queryInterface.sequelize.query(`
      ALTER TABLE activity_history 
      ALTER COLUMN workout_video_id DROP NOT NULL;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE activity_history 
      ALTER COLUMN program_id DROP NOT NULL;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE activity_history 
      ALTER COLUMN day DROP NOT NULL;
    `);

    // Add indexes for new columns
    await queryInterface.addIndex('activity_history', ['targeted_workout_id'], {
      name: 'idx_activity_history_targeted_workout_id'
    });

    await queryInterface.addIndex('activity_history', ['activity_type'], {
      name: 'idx_activity_history_activity_type'
    });

    // Update existing records to ensure data consistency
    await queryInterface.sequelize.query(`
      UPDATE activity_history 
      SET activity_type = 'PROGRAM_WORKOUT' 
      WHERE activity_type IS NULL;
    `);

    // Also update any records that might have workout_video_id to be PROGRAM_WORKOUT
    await queryInterface.sequelize.query(`
      UPDATE activity_history 
      SET activity_type = 'PROGRAM_WORKOUT' 
      WHERE workout_video_id IS NOT NULL 
      AND activity_type = 'PROGRAM_WORKOUT';
    `);

    console.log('✅ Migration completed: Added targeted workout support to activity_history');
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes first
    try {
      await queryInterface.removeIndex('activity_history', 'idx_activity_history_targeted_workout_id');
      await queryInterface.removeIndex('activity_history', 'idx_activity_history_activity_type');
    } catch (error) {
      console.log('Warning: Indexes might not exist:', error.message);
    }

    // Remove the new columns
    await queryInterface.removeColumn('activity_history', 'targeted_workout_id');
    await queryInterface.removeColumn('activity_history', 'activity_type');

    // Restore columns to NOT NULL
    await queryInterface.sequelize.query(`
      ALTER TABLE activity_history 
      ALTER COLUMN workout_video_id SET NOT NULL;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE activity_history 
      ALTER COLUMN program_id SET NOT NULL;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE activity_history 
      ALTER COLUMN day SET NOT NULL;
    `);

    // Drop the ENUM type
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_activity_history_activity_type";
    `);

    console.log('✅ Migration rolled back: Removed targeted workout support from activity_history');
  }
};