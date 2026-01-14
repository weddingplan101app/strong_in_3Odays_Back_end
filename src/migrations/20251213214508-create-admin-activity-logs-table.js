    'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('admin_activity_logs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      admin_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'admins',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      action_type: {
        type: Sequelize.ENUM('login', 'logout', 'create', 'update', 'delete', 'upload', 'download', 'export', 'import', 'approve', 'reject', 'system_action'),
        allowNull: false
      },
      description: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      entity_type: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      entity_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      old_values: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      new_values: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: true
      },
      user_agent: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      was_successful: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      error_message: {
        type: Sequelize.TEXT,
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

    await queryInterface.addIndex('admin_activity_logs', ['admin_id']);
    await queryInterface.addIndex('admin_activity_logs', ['action_type']);
    await queryInterface.addIndex('admin_activity_logs', ['created_at']);
    await queryInterface.addIndex('admin_activity_logs', ['ip_address']);
    await queryInterface.addIndex('admin_activity_logs', ['entity_type', 'entity_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('admin_activity_logs');
  }
};