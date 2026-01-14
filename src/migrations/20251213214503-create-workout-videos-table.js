'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('workout_videos', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      program_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'programs',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      day: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      video_key: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      thumbnail_key: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      difficulty: {
        type: Sequelize.ENUM('beginner', 'intermediate', 'advanced'),
        defaultValue: 'beginner',
        allowNull: false
      },
      calories_burned: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      is_welcome_video: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      sort_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      muscle_groups: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: [],
        allowNull: false
      },
    has_adaptive_streaming: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'Whether video has been processed for adaptive streaming (HLS/DASH)'
      },
      streaming_manifest_key: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Key for HLS/DASH manifest file'
      },
      original_video_asset_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      thumbnail_asset_id: {
        type: Sequelize.UUID,
        allowNull: true
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

    await queryInterface.addIndex('workout_videos', ['program_id', 'day']);
    await queryInterface.addIndex('workout_videos', ['is_active']);
    await queryInterface.addIndex('workout_videos', ['is_welcome_video']);
    await queryInterface.addIndex('workout_videos', ['day']);
    await queryInterface.addIndex('workout_videos', ['program_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('workout_videos', { cascade: true });
  
  // Drop ENUM types
  await queryInterface.sequelize.query(`
    DROP TYPE IF EXISTS enum_workout_videos_difficulty;
  `);
  }
};