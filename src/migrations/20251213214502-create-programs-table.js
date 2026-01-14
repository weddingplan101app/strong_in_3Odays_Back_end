'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('programs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      slug: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      name: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 30
      },
      difficulty: {
        type: Sequelize.ENUM('beginner', 'intermediate', 'advanced'),
        defaultValue: 'beginner',
        allowNull: false
      },
      gender_target: {
        type: Sequelize.ENUM('male', 'female', 'both'),
        defaultValue: 'both',
        allowNull: false
      },
      equipment_required: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      cover_image_url: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('draft', 'published', 'archived'),
        defaultValue: 'draft',
        allowNull: false
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
      enrollment_count: {
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

    await queryInterface.addIndex('programs', ['slug'], { unique: true });
    await queryInterface.addIndex('programs', ['status', 'is_active']);
    await queryInterface.addIndex('programs', ['difficulty']);
    await queryInterface.addIndex('programs', ['sort_order']);
  },

  async down(queryInterface, Sequelize) {
     await queryInterface.dropTable('programs', { cascade: true });
  
  // Drop ENUM types
  await queryInterface.sequelize.query(`
    DROP TYPE IF EXISTS enum_programs_difficulty;
    DROP TYPE IF EXISTS enum_programs_gender_target;
    DROP TYPE IF EXISTS enum_programs_status;
  `);
  }
};