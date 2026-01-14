'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('subscriptions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      aggregator_product_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      aggregator_transaction_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
        unique: true
      },
      telco_ref: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      plan_type: {
        type: Sequelize.ENUM('daily', 'weekly', 'monthly'),
        allowNull: false
      },
      amount: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('active', 'pending', 'cancelled', 'expired', 'failed', 'suspended'),
        defaultValue: 'pending',
        allowNull: false
      },
      channel: {
        type: Sequelize.ENUM('SMS', 'USSD', 'WEB', 'APP'),
        defaultValue: 'SMS',
        allowNull: false
      },
      telco: {
        type: Sequelize.ENUM('MTN', 'AIRTEL', 'NINEMOBILE'),
        defaultValue: 'MTN',
        allowNull: false
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      start_date: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false
      },
      end_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      auto_renewal: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      telco_status_code: {
        type: Sequelize.STRING(10),
        allowNull: true
      },
      telco_status_message: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      aggregator_response: {
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
      }
    });

    await queryInterface.addIndex('subscriptions', ['aggregator_transaction_id'], { unique: true });
    await queryInterface.addIndex('subscriptions', ['telco_ref']);
    await queryInterface.addIndex('subscriptions', ['user_id', 'status']);
    await queryInterface.addIndex('subscriptions', ['phone']);
    await queryInterface.addIndex('subscriptions', ['status']);
    await queryInterface.addIndex('subscriptions', ['end_date']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('subscriptions');
  }
};