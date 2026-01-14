'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('targeted_workouts', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
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
      total_duration: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 180,
        comment: 'Total duration in seconds (sum of all clips)'
      },
      body_part: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'chest, arms, abs, legs, glutes, shoulders, back, full_body'
      },
      gender_target: {
        type: Sequelize.ENUM('male', 'female', 'both'),
        defaultValue: 'both'
      },
      category: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'belly_fat, toning, strength, cardio, flexibility'
      },
      difficulty: {
        type: Sequelize.ENUM('beginner', 'intermediate', 'advanced'),
        defaultValue: 'beginner'
      },
      calories_burned: {
        type: Sequelize.INTEGER,
        defaultValue: 40,
        comment: 'Estimated calories burned for complete workout'
      },
      clip_count: {
        type: Sequelize.INTEGER,
        defaultValue: 6,
        comment: 'Number of 30-second clips in this workout'
      },
      thumbnail_key: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      equipment_required: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      focus_areas: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      },
      tags: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      },
      view_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      rating: {
        type: Sequelize.FLOAT,
        defaultValue: 0.0
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      sort_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0
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
    await queryInterface.addIndex('targeted_workouts', ['body_part']);
    await queryInterface.addIndex('targeted_workouts', ['gender_target']);
    await queryInterface.addIndex('targeted_workouts', ['difficulty']);
    await queryInterface.addIndex('targeted_workouts', ['category']);
    await queryInterface.addIndex('targeted_workouts', ['is_active']);
  },

  async down(queryInterface, Sequelize) {
    // Drop indexes first
    await queryInterface.removeIndex('targeted_workouts', ['body_part']);
    await queryInterface.removeIndex('targeted_workouts', ['gender_target']);
    await queryInterface.removeIndex('targeted_workouts', ['difficulty']);
    await queryInterface.removeIndex('targeted_workouts', ['category']);
    await queryInterface.removeIndex('targeted_workouts', ['is_active']);
    
    // Drop table
    await queryInterface.dropTable('targeted_workouts', { cascade: true });
    
    // Drop ENUM types
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS enum_targeted_workouts_gender_target;
    `);
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS enum_targeted_workouts_difficulty;
    `);
  }
};