// src/migrations/XXXXXXXXXXXXXX-create-activity-logs.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('activity_logs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      action: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Action type: LOGIN, LOGOUT, PROFILE_UPDATED, etc.'
      },
      entity_type: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Entity type (user, subscription, etc.)'
      },
      entity_id: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'Entity ID'
      },
      details: {
        type: Sequelize.JSONB,
        defaultValue: {},
        allowNull: false,
        comment: 'Additional details about the activity'
      },
      ip_address: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'IP address where the action originated'
      },
      user_agent: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'User agent from the request'
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
    await queryInterface.addIndex('activity_logs', ['user_id', 'created_at']);
    await queryInterface.addIndex('activity_logs', ['action']);
    await queryInterface.addIndex('activity_logs', ['entity_type', 'entity_id']);
    await queryInterface.addIndex('activity_logs', ['user_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('activity_logs');
  }
};