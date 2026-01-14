// src/seeders/20241215000001-demo-users.js
'use strict';
// const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create test users with subscriptions
    const users = [
      {
        // id: uuidv4(),
        phone: '07012345678',
        phone_formatted: '2347012345678',
         name: 'John Chukwu',
        email: 'john.chukwu@example.com',
        // is_verified: true,
        subscription_status: 'active',
        subscription_plan: 'daily',
        subscription_end_date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        daily_streak: 3,
        last_workout_date: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        total_workouts: 7,
        total_minutes: 210,
        gender_preference: 'male',
        fitness_level: 'beginner',
        equipment_available: false,
        has_completed_welcome_video: true,
        timezone: 'Africa/Lagos',
       metadata: JSON.stringify({ source: 'seed_data', test_user: true, device: 'android' }),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        // id: uuidv4(),
        phone: '08098765432',
        phone_formatted: '2348098765432',
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        // is_verified: true,
        subscription_status: 'active',
        subscription_plan: 'weekly',
        subscription_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        daily_streak: 5,
        last_workout_date: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        total_workouts: 12,
        total_minutes: 360,
        gender_preference: 'female',
        fitness_level: 'intermediate',
        equipment_available: true,
        has_completed_welcome_video: true,
        timezone: 'Africa/Lagos',
       metadata: JSON.stringify({ source: 'seed_data', test_user: true, device: 'iphone' }),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        // id: uuidv4(),
        phone: '09055556666',
        phone_formatted: '2349055556666',
         name: 'Fatima Ibrahim',
        email: 'fatima.ibrahim@example.com',
        // is_verified: true,
        subscription_status: 'active',
        subscription_plan: 'monthly',
        subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        daily_streak: 15,
        last_workout_date: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        total_workouts: 22,
        total_minutes: 660,
        gender_preference: 'both',
        fitness_level: 'advanced',
        equipment_available: true,
        has_completed_welcome_video: true,
        timezone: 'Africa/Lagos',
        metadata: JSON.stringify({ source: 'seed_data', test_user: true, device: 'android' }),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        // id: uuidv4(),
        phone: '08123456789',
        phone_formatted: '2348123456789',
        name: null, // User hasn't provided name yet
        email: null, // User hasn't provided email yet
        // is_verified: false,
        subscription_status: 'inactive',
        subscription_plan: null,
        subscription_end_date: null,
        daily_streak: 0,
        last_workout_date: null,
        total_workouts: 0,
        total_minutes: 0,
        gender_preference: 'both',
        fitness_level: 'beginner',
        equipment_available: false,
        has_completed_welcome_video: false,
        timezone: 'Africa/Lagos',
         metadata: JSON.stringify({ source: 'seed_data', test_user: true }),
        created_at: new Date(),
        updated_at: new Date()
      }
    ];
    
    await queryInterface.bulkInsert('users', users);
    
    console.log('✅ Seeded 4 users:');
    console.log('   1. Daily subscriber - 07012345678 (3-day streak)');
    console.log('   2. Weekly subscriber - 08098765432 (5-day streak)');
    console.log('   3. Monthly subscriber - 09055556666 (15-day streak)');
    console.log('   4. Inactive user - 08123456789 (no subscription)');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', null, {});
    console.log('🗑️  All users deleted');
  }
};