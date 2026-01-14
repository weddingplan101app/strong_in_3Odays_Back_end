// src/database/migrations/20251213214510-create-foreign-keys.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. WORKOUT_VIDEOS Foreign Keys
    await queryInterface.addConstraint('workout_videos', {
      fields: ['program_id'],
      type: 'foreign key',
      name: 'fk_workout_videos_program',
      references: {
        table: 'programs',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Fix for circular dependency between workout_videos and media_assets
    await queryInterface.addConstraint('workout_videos', {
      fields: ['original_video_asset_id'],
      type: 'foreign key',
      name: 'fk_workout_videos_original_asset',
      references: {
        table: 'media_assets',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addConstraint('workout_videos', {
      fields: ['thumbnail_asset_id'],
      type: 'foreign key',
      name: 'fk_workout_videos_thumbnail_asset',
      references: {
        table: 'media_assets',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // 2. MEDIA_ASSETS Foreign Keys
    await queryInterface.addConstraint('media_assets', {
      fields: ['uploaded_by'],
      type: 'foreign key',
      name: 'fk_media_assets_admin',
      references: {
        table: 'admins',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT' // Don't delete media if admin is deleted
    });

    await queryInterface.addConstraint('media_assets', {
      fields: ['workout_video_id'],
      type: 'foreign key',
      name: 'fk_media_assets_workout_video',
      references: {
        table: 'workout_videos',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addConstraint('media_assets', {
      fields: ['program_id'],
      type: 'foreign key',
      name: 'fk_media_assets_program',
      references: {
        table: 'programs',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // 3. ACTIVITY_HISTORY Foreign Keys (already have FK in migration but adding constraint)
    await queryInterface.addConstraint('activity_history', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'fk_activity_history_user',
      references: {
        table: 'users',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE' // Delete activity when user is deleted
    });

    await queryInterface.addConstraint('activity_history', {
      fields: ['workout_video_id'],
      type: 'foreign key',
      name: 'fk_activity_history_workout_video',
      references: {
        table: 'workout_videos',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE' // Delete activity when video is deleted
    });

    // 4. SUBSCRIPTIONS Foreign Key
    await queryInterface.addConstraint('subscriptions', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'fk_subscriptions_user',
      references: {
        table: 'users',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE' // Delete subscriptions when user is deleted
    });

    // 5. VIDEO_PROCESSING_QUEUE Foreign Keys
    await queryInterface.addConstraint('video_processing_queue', {
      fields: ['media_asset_id'],
      type: 'foreign key',
      name: 'fk_processing_queue_media_asset',
      references: {
        table: 'media_assets',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE' // Delete queue items when media is deleted
    });

    await queryInterface.addConstraint('video_processing_queue', {
      fields: ['processed_by'],
      type: 'foreign key',
      name: 'fk_processing_queue_admin',
      references: {
        table: 'admins',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // 6. ADMIN_ACTIVITY_LOGS Foreign Key
    await queryInterface.addConstraint('admin_activity_logs', {
      fields: ['admin_id'],
      type: 'foreign key',
      name: 'fk_admin_activity_logs_admin',
      references: {
        table: 'admins',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE' // Delete logs when admin is deleted
    });

    // 7. ADMIN_INVITES Foreign Keys
    await queryInterface.addConstraint('admin_invites', {
      fields: ['invited_by'],
      type: 'foreign key',
      name: 'fk_admin_invites_inviter',
      references: {
        table: 'admins',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    await queryInterface.addConstraint('admin_invites', {
      fields: ['accepted_by_admin_id'],
      type: 'foreign key',
      name: 'fk_admin_invites_acceptor',
      references: {
        table: 'admins',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove all constraints in reverse order
    const constraints = [
      'fk_workout_videos_program',
      'fk_workout_videos_original_asset',
      'fk_workout_videos_thumbnail_asset',
      'fk_media_assets_admin',
      'fk_media_assets_workout_video',
      'fk_media_assets_program',
      'fk_activity_history_user',
      'fk_activity_history_workout_video',
      'fk_subscriptions_user',
      'fk_processing_queue_media_asset',
      'fk_processing_queue_admin',
      'fk_admin_activity_logs_admin',
      'fk_admin_invites_inviter',
      'fk_admin_invites_acceptor'
    ];

    for (const constraint of constraints) {
      try {
        await queryInterface.removeConstraint('workout_videos', constraint);
      } catch (e) {}
      try {
        await queryInterface.removeConstraint('media_assets', constraint);
      } catch (e) {}
      try {
        await queryInterface.removeConstraint('activity_history', constraint);
      } catch (e) {}
      try {
        await queryInterface.removeConstraint('subscriptions', constraint);
      } catch (e) {}
      try {
        await queryInterface.removeConstraint('video_processing_queue', constraint);
      } catch (e) {}
      try {
        await queryInterface.removeConstraint('admin_activity_logs', constraint);
      } catch (e) {}
      try {
        await queryInterface.removeConstraint('admin_invites', constraint);
      } catch (e) {}
    }
  }
};