'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add unique constraint separately
    await queryInterface.addConstraint('admins', {
      fields: ['username'],
      type: 'unique',
      name: 'admins_username_unique'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('admins', 'admins_username_unique');
  }
};