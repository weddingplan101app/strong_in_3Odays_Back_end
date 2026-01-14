    'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('admin_invites', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      invited_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'admins',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      token: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      role: {
        type: Sequelize.ENUM('super_admin', 'content_manager', 'video_editor', 'support', 'viewer'),
        defaultValue: 'content_manager',
        allowNull: false
      },
      permissions: {
        type: Sequelize.JSONB,
        defaultValue: [],
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'accepted', 'expired', 'revoked'),
        defaultValue: 'pending',
        allowNull: false
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      accepted_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      accepted_by_admin_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'admins',
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

    await queryInterface.addIndex('admin_invites', ['token'], { unique: true });
    await queryInterface.addIndex('admin_invites', ['status']);
    await queryInterface.addIndex('admin_invites', ['email']);
    await queryInterface.addIndex('admin_invites', ['invited_by']);
    await queryInterface.addIndex('admin_invites', ['expires_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('admin_invites');
  }
};