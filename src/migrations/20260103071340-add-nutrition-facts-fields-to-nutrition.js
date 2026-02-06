// migrations/YYYYMMDDHHMMSS-add-nutrition-facts-fields-to-nutrition.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add new columns for nutrition facts
    await queryInterface.addColumn('nutrition', 'protein_g', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: null,
      comment: 'Protein content in grams'
    });

    await queryInterface.addColumn('nutrition', 'carbs_g', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: null,
      comment: 'Carbohydrates content in grams'
    });

    await queryInterface.addColumn('nutrition', 'fat_g', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: null,
      comment: 'Fat content in grams'
    });

    await queryInterface.addColumn('nutrition', 'fiber_g', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: null,
      comment: 'Fiber content in grams'
    });

    await queryInterface.addColumn('nutrition', 'servings', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: null,
      comment: 'Number of servings'
    });

    
    await queryInterface.addColumn('nutrition', 'difficulty', {
      type: Sequelize.ENUM('beginner', 'intermediate', 'advanced'),
      allowNull: true,
      defaultValue: 'intermediate',
      comment: 'Difficulty level of the recipe'
    });

    // Optional: Add an index for servings if you'll frequently query by servings
    await queryInterface.addIndex('nutrition', ['servings'], {
      name: 'nutrition_servings_idx',
      unique: false
    });

    // Optional: Add index for difficulty
    await queryInterface.addIndex('nutrition', ['difficulty'], {
      name: 'nutrition_difficulty_idx',
      unique: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the indexes first
    await queryInterface.removeIndex('nutrition', 'nutrition_difficulty_idx');
    await queryInterface.removeIndex('nutrition', 'nutrition_servings_idx');
    
    // Remove the columns in reverse order
    await queryInterface.removeColumn('nutrition', 'difficulty');
    await queryInterface.removeColumn('nutrition', 'servings');
    await queryInterface.removeColumn('nutrition', 'fiber_g');
    await queryInterface.removeColumn('nutrition', 'fat_g');
    await queryInterface.removeColumn('nutrition', 'carbs_g');
    await queryInterface.removeColumn('nutrition', 'protein_g');
    
    // Drop the ENUM type (PostgreSQL specific)
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_nutrition_difficulty;');
  }
};