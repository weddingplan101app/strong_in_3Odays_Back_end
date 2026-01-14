// src/migrations/[timestamp]-create-nutrition-table.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Enable UUID extension (PostgreSQL specific)
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    
    await queryInterface.createTable('nutrition', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      day: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Day of program (1-30), null for general tips'
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      detailed_content: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      image_url: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      video_url: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      category: {
        type: Sequelize.ENUM('breakfast', 'lunch', 'dinner', 'snack', 'general', 'recipe', 'tip'),
        defaultValue: 'general',
        allowNull: false
      },
      calories: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      ingredients: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: [],
        allowNull: false
      },
      preparation_steps: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        defaultValue: [],
        allowNull: false
      },
      prep_time: {
        type: Sequelize.STRING(50),
        allowNull: true
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

    // Create indexes
    await queryInterface.addIndex('nutrition', ['category'], {
      name: 'nutrition_category_idx'
    });
    
    await queryInterface.addIndex('nutrition', ['day'], {
      name: 'nutrition_day_idx'
    });
    
    await queryInterface.addIndex('nutrition', ['is_active'], {
      name: 'nutrition_is_active_idx'
    });
    
    await queryInterface.addIndex('nutrition', ['day', 'sort_order'], {
      name: 'nutrition_day_sort_order_idx'
    });
    
    await queryInterface.addIndex('nutrition', ['sort_order'], {
      name: 'nutrition_sort_order_idx'
    });
    
    console.log('✅ Created nutrition table');
  },

  async down(queryInterface, Sequelize) {
    // Drop indexes first
    await queryInterface.removeIndex('nutrition', 'nutrition_category_idx');
    await queryInterface.removeIndex('nutrition', 'nutrition_day_idx');
    await queryInterface.removeIndex('nutrition', 'nutrition_is_active_idx');
    await queryInterface.removeIndex('nutrition', 'nutrition_day_sort_order_idx');
    await queryInterface.removeIndex('nutrition', 'nutrition_sort_order_idx');
    
    // Drop table with CASCADE
    await queryInterface.dropTable('nutrition', { cascade: true });
    
    // Drop ENUM type
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS enum_nutrition_category;
    `);
    
    console.log('❌ Dropped nutrition table');
  }
};