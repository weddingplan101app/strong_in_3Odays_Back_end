// src/database/migrations/XXXXXXXXXXXXXX-create-users-table.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Enable necessary extensions
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "pg_trgm";');
    
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      phone_formatted: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: true,
        // comment: 'Full name of the user'
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: true,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      subscription_status: {
        type: Sequelize.ENUM('active', 'inactive', 'expired', 'pending', 'failed', 'cancelled'),
        defaultValue: 'inactive',
        allowNull: false
      },
      subscription_plan: {
        type: Sequelize.ENUM('daily', 'weekly', 'monthly'),
        allowNull: true
      },
      subscription_end_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      daily_streak: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      last_workout_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      total_workouts: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      total_minutes: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      gender_preference: {
        type: Sequelize.ENUM('male', 'female', 'both'),
        defaultValue: 'both',
        allowNull: false
      },
      fitness_level: {
        type: Sequelize.ENUM('beginner', 'intermediate', 'advanced'),
        defaultValue: 'beginner',
        allowNull: false
      },
      equipment_available: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      has_completed_welcome_video: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      timezone: {
        type: Sequelize.STRING(50),
        allowNull: true,
        defaultValue: 'Africa/Lagos'
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {},
        allowNull: false
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
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Create indexes
    await queryInterface.addIndex('users', ['phone_formatted'], { 
      unique: true,
      name: 'users_phone_formatted_unique'
    });
    
    await queryInterface.addIndex('users', ['subscription_status'], {
      name: 'users_subscription_status_idx'
    });
    
    await queryInterface.addIndex('users', ['subscription_end_date'], {
      name: 'users_subscription_end_date_idx'
    });
    
    await queryInterface.addIndex('users', ['phone'], {
      name: 'users_phone_idx'
    });
    
    await queryInterface.addIndex('users', ['email'], {
      name: 'users_email_idx',
      unique: true,
      where: {
        email: {
          [Sequelize.Op.ne]: null
        }
      }
    });
    
    // Create GIN index for name using raw SQL to ensure proper operator class
    await queryInterface.sequelize.query(
      'CREATE INDEX IF NOT EXISTS "users_name_idx" ON "users" USING gin (name gin_trgm_ops);'
    );
  },

  async down(queryInterface, Sequelize) {
    // Drop indexes first
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS "users_name_idx";');
    await queryInterface.removeIndex('users', 'users_phone_formatted_unique');
    await queryInterface.removeIndex('users', 'users_subscription_status_idx');
    await queryInterface.removeIndex('users', 'users_subscription_end_date_idx');
    await queryInterface.removeIndex('users', 'users_phone_idx');
    await queryInterface.removeIndex('users', 'users_email_idx');
    
    // Drop ENUM types (PostgreSQL specific)
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS enum_users_subscription_status;
      DROP TYPE IF EXISTS enum_users_subscription_plan;
      DROP TYPE IF EXISTS enum_users_gender_preference;
      DROP TYPE IF EXISTS enum_users_fitness_level;
    `);
    
    await queryInterface.dropTable('users');
  }
};