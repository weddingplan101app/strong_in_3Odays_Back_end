'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('targeted_workout_clips', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      targeted_workout_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'targeted_workouts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      clip_order: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      exercise: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 30,
        comment: 'Duration in seconds (always 30 seconds)'
      },
      video_key: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      thumbnail_key: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      instructions: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      tips: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      calories_burned: {
        type: Sequelize.INTEGER,
        defaultValue: 5
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      original_video_asset_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'media_assets',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      thumbnail_asset_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'media_assets',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('targeted_workout_clips', ['targeted_workout_id']);
    await queryInterface.addIndex('targeted_workout_clips', ['clip_order']);
    await queryInterface.addIndex('targeted_workout_clips', ['is_active']);
    
    // Composite index for ordering within a workout
    await queryInterface.addIndex('targeted_workout_clips', 
      ['targeted_workout_id', 'clip_order'], 
      {
        unique: true,
        name: 'targeted_workout_clips_workout_order_unique'
      }
    );
  },

  async down(queryInterface, Sequelize) {
    // Drop indexes first
    await queryInterface.removeIndex('targeted_workout_clips', ['targeted_workout_id']);
    await queryInterface.removeIndex('targeted_workout_clips', ['clip_order']);
    await queryInterface.removeIndex('targeted_workout_clips', ['is_active']);
    await queryInterface.removeIndex('targeted_workout_clips', 'targeted_workout_clips_workout_order_unique');
    
    // Drop table
    await queryInterface.dropTable('targeted_workout_clips', { cascade: true });
  }
};