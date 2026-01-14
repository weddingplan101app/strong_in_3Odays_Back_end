'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('video_processing_queue', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      media_asset_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'media_assets',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      processed_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'admins',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      status: {
        type: Sequelize.STRING(50),
        defaultValue: 'pending',
        allowNull: false
      },
      priority: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      processing_options: {
        type: Sequelize.JSONB,
        defaultValue: {},
        allowNull: false
      },
      retry_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      processing_result: {
        type: Sequelize.JSONB,
        defaultValue: {},
        allowNull: false
      },
      started_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      next_retry_at: {
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

    await queryInterface.addIndex('video_processing_queue', ['status']);
    await queryInterface.addIndex('video_processing_queue', ['priority', 'created_at']);
    await queryInterface.addIndex('video_processing_queue', ['media_asset_id']);
    await queryInterface.addIndex('video_processing_queue', ['processed_by']);
    await queryInterface.addIndex('video_processing_queue', ['next_retry_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('video_processing_queue');
  }
};