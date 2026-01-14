'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('activity_history', {
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
      workout_video_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'workout_videos',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      day: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      watched_duration: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      is_completed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      rating: {
        type: Sequelize.INTEGER,
        allowNull: true
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

    await queryInterface.addIndex('activity_history', ['user_id', 'workout_video_id']);
    await queryInterface.addIndex('activity_history', ['user_id', 'day']);
    await queryInterface.addIndex('activity_history', ['user_id', 'created_at']);
    await queryInterface.addIndex('activity_history', ['is_completed']);
    await queryInterface.addIndex('activity_history', ['user_id']);
    await queryInterface.addIndex('activity_history', ['workout_video_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('activity_history');
  }
};