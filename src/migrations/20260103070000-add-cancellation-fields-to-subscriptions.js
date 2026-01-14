'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('subscriptions', 'cancelled_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('subscriptions', 'cancellation_reason', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('subscriptions', 'cancelled_at');
    await queryInterface.removeColumn('subscriptions', 'cancellation_reason');
  }
};
