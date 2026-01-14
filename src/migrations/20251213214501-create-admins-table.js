'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('admins', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      username: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false
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
      profile_image_url: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      is_super_admin: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      force_password_change: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      last_login_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      last_login_ip: {
        type: Sequelize.STRING(45),
        allowNull: true
      },
      two_factor_secret: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      two_factor_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      reset_password_token: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      reset_password_expires: {
        type: Sequelize.DATE,
        allowNull: true
      },
      password_changed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      preferences: {
        type: Sequelize.JSONB,
        defaultValue: {},
        allowNull: false
      },
      department: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      failed_login_attempts: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      locked_until: {
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

    await queryInterface.addIndex('admins', ['email'], { unique: true });
    await queryInterface.addIndex('admins', ['username'], { unique: true });
    await queryInterface.addIndex('admins', ['role']);
    await queryInterface.addIndex('admins', ['is_active']);
  },

  async down(queryInterface, Sequelize) {
     await queryInterface.dropTable('admins', { cascade: true });
  
  // Drop ENUM types
  await queryInterface.sequelize.query(`
    DROP TYPE IF EXISTS enum_admins_role;
  `);
  }
};