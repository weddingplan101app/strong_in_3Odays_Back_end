'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('media_assets', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      uploaded_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'admins',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      workout_video_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'workout_videos',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
      storage_key: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      filename: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      file_extension: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      file_size: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      mime_type: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      asset_type: {
        type: Sequelize.ENUM('video', 'image', 'audio', 'document'),
        allowNull: false
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {},
        allowNull: false
      },
      processing_status: {
        type: Sequelize.STRING(50),
        defaultValue: 'pending',
        allowNull: false
      },
      file_purpose: {
        type: Sequelize.ENUM('original', 'thumbnail', 'hls_manifest', 'hls_segment', 'dash_manifest', 'preview', 'transcoded'),
        allowNull: false
      },
      cdn_url: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      direct_url: {
        type: Sequelize.STRING(1000),
        allowNull: true
      },
      processing_log: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      width: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      height: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      is_archived: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      processed_at: {
        type: Sequelize.DATE,
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

    await queryInterface.addIndex('media_assets', ['storage_key'], { unique: true });
    await queryInterface.addIndex('media_assets', ['uploaded_by']);
    await queryInterface.addIndex('media_assets', ['asset_type', 'processing_status']);
    await queryInterface.addIndex('media_assets', ['workout_video_id']);
    await queryInterface.addIndex('media_assets', ['program_id']);
    await queryInterface.addIndex('media_assets', ['file_purpose']);
  },

  async down(queryInterface, Sequelize) {
     await queryInterface.dropTable('media_assets', { cascade: true });
  
  // Drop ENUM types
  await queryInterface.sequelize.query(`
    DROP TYPE IF EXISTS enum_media_assets_asset_type;
    DROP TYPE IF EXISTS enum_media_assets_file_purpose;
  `);
  }
};