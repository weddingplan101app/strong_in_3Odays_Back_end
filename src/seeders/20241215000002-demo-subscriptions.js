  // src/seeders/20241215000002-demo-subscriptions.js
  'use strict';
  // const { v4: uuidv4 } = require('uuid');

  module.exports = {
    async up(queryInterface, Sequelize) {
      // Get user ids from the users table (assuming they were seeded in the previous seeder)
      const [users] = await queryInterface.sequelize.query(
        `SELECT id, phone_formatted, subscription_end_date FROM users ORDER BY phone_formatted`
      );

      // If no users found, we need to create them first or return
      if (!users || users.length === 0) {
        console.log('⚠️  No users found. Please run the user seeder first.');
        return;
      }

      // Create subscriptions for active users
      const subscriptions = [
        {
          // id: uuidv4(),
          user_id: users[0].id,
          aggregator_product_id: 1,
          aggregator_transaction_id: 'TRX-001',
          telco_ref: 'REF-001',
          plan_type: 'daily',
          amount: 10000,
          status: 'active',
          channel: 'SMS',
          telco: 'MTN',
          phone: users[0].phone_formatted,
          start_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          end_date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          auto_renewal: true,
          telco_status_code: '0',
          telco_status_message: 'Success',
          aggregator_response: JSON.stringify({ source: 'seed_data', test_user: true, user_index: 0 }),
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          // id: uuidv4(),
          user_id: users[1].id,
          aggregator_product_id: 2,
          aggregator_transaction_id: 'TRX-002',
          telco_ref: 'REF-002',
          plan_type: 'weekly',
          amount: 50000,
          status: 'active',
          channel: 'SMS',
          telco: 'AIRTEL',
          phone: users[1].phone_formatted,
          start_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          end_date: users[1].subscription_end_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          auto_renewal: true,
          telco_status_code: '0',
          telco_status_message: 'Success',
          aggregator_response: JSON.stringify({ source: 'seed_data', test_user: true, user_index: 1 }),
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          // id: uuidv4(),
          user_id: users[2].id,
          aggregator_product_id: 3,
          aggregator_transaction_id: 'TRX-003',
          telco_ref: 'REF-003',
          plan_type: 'monthly',
          amount: 150000,
          status: 'active',
          channel: 'SMS',
          telco: 'MTN',
          phone: users[2].phone_formatted,
          start_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
          end_date: users[2].subscription_end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          auto_renewal: true,
          telco_status_code: '0',
          telco_status_message: 'Success',
          aggregator_response: JSON.stringify({ source: 'seed_data', test_user: true, user_index: 2 }),
          created_at: new Date(),
          updated_at: new Date()
        }
      ];
      
      // Add a failed subscription for user 3 (inactive user) if exists
      if (users[3]) {
        subscriptions.push({
          // id: uuidv4(),
          user_id: users[3].id,
          aggregator_product_id: 1,
          aggregator_transaction_id: 'TRX-004',
          telco_ref: 'REF-004',
          plan_type: 'daily',
          amount: 10000,
          status: 'failed',
          channel: 'SMS',
          telco: 'MTN',
          phone: users[3].phone_formatted,
          start_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          end_date: null,
          auto_renewal: false,
          telco_status_code: '500',
          telco_status_message: 'Payment failed',
          aggregator_response: JSON.stringify({ 
            source: 'seed_data', 
            test_user: true, 
            user_index: 3,
            failure_reason: 'Insufficient balance'
          }),
          created_at: new Date(),
          updated_at: new Date()
        });
      }
      
      await queryInterface.bulkInsert('subscriptions', subscriptions);
      
      console.log(`✅ Seeded ${subscriptions.length} subscriptions`);
      console.log('📱 Subscription Summary:');
      console.log('   User 1 (07012345678): Daily plan, active, ₦100, expires tomorrow');
      console.log('   User 2 (08098765432): Weekly plan, active, ₦500, expires in 7 days');
      console.log('   User 3 (09055556666): Monthly plan, active, ₦1,500, expires in 30 days');
      if (users[3]) {
        console.log('   User 4 (08123456789): Daily plan, failed, ₦100');
      }
    },

    async down(queryInterface, Sequelize) {
      await queryInterface.bulkDelete('subscriptions', null, {});
      console.log('🗑️  All subscriptions deleted');
    }
  };