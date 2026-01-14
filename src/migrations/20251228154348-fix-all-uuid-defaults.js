'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Enable the uuid-ossp extension if not already enabled
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    // List of tables that need UUID defaults
    const tables = [
      'users',
      'subscriptions',
      'programs',
      'workout_videos',
      'nutrition'
      // Add any other tables that use UUID primary keys
    ];

    // Add UUID default to each table
    for (const table of tables) {
      try {
        await queryInterface.sequelize.query(`
          ALTER TABLE "${table}" 
          ALTER COLUMN "id" SET DEFAULT uuid_generate_v4(),
          ALTER COLUMN "id" SET NOT NULL;
        `);
        console.log(`✅ Set UUID default for ${table}.id`);
      } catch (error) {
        console.warn(`⚠️  Could not alter ${table}:`, error.message);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // No need to implement the down migration
    // as we don't want to remove these constraints
  }
};