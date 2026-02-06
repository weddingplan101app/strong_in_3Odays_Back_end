// src/seeders/20241215000005-demo-targeted-workouts-fixed.js
'use strict';
const { v4: uuidv4 } = require('uuid');

// Reuse the same cover images from programs seeder
const uploadedCovers = [
  'cover/plus-size-person-working-out.jpg',
  'cover/portrait-athletic-man-doing-box-jump-exercise-crossfit-sport-healt.jpg',
  'cover/handsome-black-man-is-engaged-gym.jpg',
  'cover/athletic-man-practicing-gymnastics-keep-fit.jpg',
  'cover/full-shot-man-doing-exercise-gym.jpg',
  'cover/side-view-man-training-with-dumbbells.jpg',
  'cover/handsome-black-man-is-engaged-gym.jpg',
  'cover/beautiful-black-girl-is-engaged-gym.jpg',
  'cover/full-shot-woman-training-outdoors.jpg',
  'cover/full-shot-man-training-outdoors.jpg',
  'cover/side-view-athlete-holding-weights-with-copy-space.jpg'
];

// Categorize covers by gender/focus
const coverCategories = {
  male: [
    'cover/handsome-black-man-is-engaged-gym.jpg',
    'cover/full-shot-man-training-outdoors.jpg',
    'cover/full-shot-man-doing-exercise-gym.jpg',
    'cover/side-view-man-training-with-dumbbells.jpg',
    'cover/portrait-athletic-man-doing-box-jump-exercise-crossfit-sport-healt.jpg',
    'cover/athletic-man-practicing-gymnastics-keep-fit.jpg'
  ],
  female: [
    'cover/beautiful-black-girl-is-engaged-gym.jpg',
    'cover/full-shot-woman-training-outdoors.jpg',
    'cover/plus-size-person-working-out.jpg'
  ],
  both: [
    'cover/side-view-athlete-holding-weights-with-copy-space.jpg'
  ]
};

module.exports = {
  async up(queryInterface, Sequelize) {
    // Helper function to get appropriate cover for targeted workout
    function getCoverForTargetedWorkout(genderTarget, bodyPart, sortOrder) {
      let coverPool = [];
      
      // Choose cover pool based on gender target
      if (genderTarget === 'male') {
        coverPool = coverCategories.male;
      } else if (genderTarget === 'female') {
        coverPool = coverCategories.female;
      } else {
        coverPool = coverCategories.both;
      }
      
      // If no suitable covers found, use all covers
      if (coverPool.length === 0) {
        coverPool = uploadedCovers;
      }
      
      // Use deterministic index based on sortOrder
      const coverIndex = sortOrder % coverPool.length;
      return coverPool[coverIndex];
    }
    
    // Create targeted workouts based on PRD requirements (3-5 minute workouts)
    const targetedWorkouts = [
      // ========== WOMEN'S WORKOUTS (PRD Focus: Belly fat, toning, curves) ==========
      {
        id: uuidv4(),
        title: '5-Minute Belly Fat Burner',
        description: 'Target stubborn belly fat with 30-second high-intensity intervals',
        total_duration: 300, // 5 minutes (10 clips × 30s)
        body_part: 'abs',
        gender_target: 'female',
        category: 'belly_fat',
        difficulty: 'beginner',
        calories_burned: 50,
        clip_count: 10,
        // ✅ Using Digital Ocean cover from programs
        thumbnail_key: getCoverForTargetedWorkout('female', 'abs', 1),
        equipment_required: false,
        focus_areas: ['lower abs', 'obliques', 'core'],
        tags: ['belly fat', 'abs', 'core', 'women', 'quick'],
        view_count: 2150,
        rating: 4.8,
        is_active: true,
        sort_order: 1,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        title: 'Arm Toning in 3 Minutes',
        description: 'Sculpt and tone arms without equipment',
        total_duration: 180, // 3 minutes (6 clips × 30s)
        body_part: 'arms',
        gender_target: 'female',
        category: 'toning',
        difficulty: 'beginner',
        calories_burned: 30,
        clip_count: 6,
        // ✅ Using Digital Ocean cover from programs
        thumbnail_key: getCoverForTargetedWorkout('female', 'arms', 2),
        equipment_required: false,
        focus_areas: ['biceps', 'triceps', 'toning'],
        tags: ['arms', 'toning', 'women', 'no equipment'],
        view_count: 1850,
        rating: 4.6,
        is_active: true,
        sort_order: 2,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        title: 'Glute & Leg Sculptor',
        description: 'Build curves and tone lower body in 4 minutes',
        total_duration: 240, // 4 minutes (8 clips × 30s)
        body_part: 'glutes',
        gender_target: 'female',
        category: 'curves',
        difficulty: 'beginner',
        calories_burned: 45,
        clip_count: 8,
        // ✅ Using Digital Ocean cover from programs
        thumbnail_key: getCoverForTargetedWorkout('female', 'glutes', 3),
        equipment_required: false,
        focus_areas: ['glutes', 'thighs', 'curves'],
        tags: ['glutes', 'legs', 'curves', 'women', 'toning'],
        view_count: 1920,
        rating: 4.7,
        is_active: true,
        sort_order: 3,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        title: 'Full Body Toning',
        description: 'Complete body toning workout for women',
        total_duration: 300, // 5 minutes (10 clips × 30s)
        body_part: 'full_body',
        gender_target: 'female',
        category: 'toning',
        difficulty: 'intermediate',
        calories_burned: 55,
        clip_count: 10,
        // ✅ Using Digital Ocean cover from programs
        thumbnail_key: getCoverForTargetedWorkout('female', 'full_body', 4),
        equipment_required: false,
        focus_areas: ['total body', 'toning', 'lean muscle'],
        tags: ['full body', 'toning', 'women', 'complete'],
        view_count: 1350,
        rating: 4.9,
        is_active: true,
        sort_order: 4,
        created_at: new Date(),
        updated_at: new Date()
      },

      // ========== MEN'S WORKOUTS (PRD Focus: Strength, fat loss, chest/arms) ==========
      {
        id: uuidv4(),
        title: 'Chest Builder in 3 Minutes',
        description: 'Build chest strength with push-up variations',
        total_duration: 180, // 3 minutes (6 clips × 30s)
        body_part: 'chest',
        gender_target: 'male',
        category: 'strength',
        difficulty: 'intermediate',
        calories_burned: 40,
        clip_count: 6,
        // ✅ Using Digital Ocean cover from programs
        thumbnail_key: getCoverForTargetedWorkout('male', 'chest', 5),
        equipment_required: false,
        focus_areas: ['chest', 'pectorals', 'strength'],
        tags: ['chest', 'pushups', 'strength', 'men'],
        view_count: 1450,
        rating: 4.7,
        is_active: true,
        sort_order: 5,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        title: 'Arm Strength Blast',
        description: 'Build arm muscle with intense 30-second intervals',
        total_duration: 240, // 4 minutes (8 clips × 30s)
        body_part: 'arms',
        gender_target: 'male',
        category: 'strength',
        difficulty: 'intermediate',
        calories_burned: 50,
        clip_count: 8,
        // ✅ Using Digital Ocean cover from programs
        thumbnail_key: getCoverForTargetedWorkout('male', 'arms', 6),
        equipment_required: false,
        focus_areas: ['biceps', 'triceps', 'forearms'],
        tags: ['arms', 'biceps', 'triceps', 'strength', 'men'],
        view_count: 1280,
        rating: 4.6,
        is_active: true,
        sort_order: 6,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        title: 'Fat Burn Express',
        description: 'High-intensity fat burning workout for men',
        total_duration: 300, // 5 minutes (10 clips × 30s)
        body_part: 'full_body',
        gender_target: 'male',
        category: 'fat_loss',
        difficulty: 'intermediate',
        calories_burned: 60,
        clip_count: 10,
        // ✅ Using Digital Ocean cover from programs
        thumbnail_key: getCoverForTargetedWorkout('male', 'full_body', 7),
        equipment_required: false,
        focus_areas: ['fat burning', 'cardio', 'metabolism'],
        tags: ['fat loss', 'cardio', 'hiit', 'men', 'burn'],
        view_count: 1650,
        rating: 4.5,
        is_active: true,
        sort_order: 7,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        title: 'Dumbbell Arm Builder',
        description: 'Advanced arm workout using dumbbells',
        total_duration: 240, // 4 minutes (8 clips × 30s)
        body_part: 'arms',
        gender_target: 'male',
        category: 'strength',
        difficulty: 'advanced',
        calories_burned: 55,
        clip_count: 8,
        // ✅ Using Digital Ocean cover from programs
        thumbnail_key: getCoverForTargetedWorkout('male', 'arms', 8),
        equipment_required: true,
        focus_areas: ['bicep growth', 'tricep definition'],
        tags: ['dumbbell', 'weights', 'advanced', 'men', 'gym'],
        view_count: 850,
        rating: 4.8,
        is_active: true,
        sort_order: 8,
        created_at: new Date(),
        updated_at: new Date()
      },

      // ========== UNISEX / BOTH GENDERS ==========
      {
        id: uuidv4(),
        title: 'Quick Cardio Blast',
        description: 'Get your heart pumping in 3 minutes',
        total_duration: 180, // 3 minutes (6 clips × 30s)
        body_part: 'full_body',
        gender_target: 'both',
        category: 'cardio',
        difficulty: 'beginner',
        calories_burned: 45,
        clip_count: 6,
        // ✅ Using Digital Ocean cover from programs
        thumbnail_key: getCoverForTargetedWorkout('both', 'full_body', 9),
        equipment_required: false,
        focus_areas: ['cardiovascular', 'endurance'],
        tags: ['cardio', 'hiit', 'quick', 'energy', 'fat burn'],
        view_count: 2100,
        rating: 4.5,
        is_active: true,
        sort_order: 9,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        title: 'Core Strength in 4 Minutes',
        description: 'Build strong abs and core for better posture',
        total_duration: 240, // 4 minutes (8 clips × 30s)
        body_part: 'abs',
        gender_target: 'both',
        category: 'strength',
        difficulty: 'intermediate',
        calories_burned: 40,
        clip_count: 8,
        // ✅ Using Digital Ocean cover from programs
        thumbnail_key: getCoverForTargetedWorkout('both', 'abs', 10),
        equipment_required: false,
        focus_areas: ['core stability', 'abs', 'posture'],
        tags: ['core', 'abs', 'stability', 'posture'],
        view_count: 1750,
        rating: 4.7,
        is_active: true,
        sort_order: 10,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        title: 'Office Worker Relief',
        description: 'Counteract sitting with 3-minute mobility workout',
        total_duration: 180, // 3 minutes (6 clips × 30s)
        body_part: 'full_body',
        gender_target: 'both',
        category: 'flexibility',
        difficulty: 'beginner',
        calories_burned: 25,
        clip_count: 6,
        // ✅ Using Digital Ocean cover from programs
        thumbnail_key: getCoverForTargetedWorkout('both', 'full_body', 11),
        equipment_required: false,
        focus_areas: ['mobility', 'posture', 'back pain'],
        tags: ['office', 'desk job', 'posture', 'mobility', 'relief'],
        view_count: 1200,
        rating: 4.8,
        is_active: true,
        sort_order: 11,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        title: 'Morning Energy Boost',
        description: 'Energize your day with this 4-minute routine',
        total_duration: 240, // 4 minutes (8 clips × 30s)
        body_part: 'full_body',
        gender_target: 'both',
        category: 'cardio',
        difficulty: 'beginner',
        calories_burned: 35,
        clip_count: 8,
        // ✅ Using Digital Ocean cover from programs
        thumbnail_key: getCoverForTargetedWorkout('both', 'full_body', 12),
        equipment_required: false,
        focus_areas: ['energy', 'mood', 'metabolism'],
        tags: ['morning', 'energy', 'wake up', 'quick'],
        view_count: 1950,
        rating: 4.6,
        is_active: true,
        sort_order: 12,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];
    
    await queryInterface.bulkInsert('targeted_workouts', targetedWorkouts);
    
    console.log(`✅ Seeded ${targetedWorkouts.length} targeted workouts`);
    console.log('💪 Targeted Workouts Summary (3-5 minute workouts):');
    console.log(`   Women's workouts: ${targetedWorkouts.filter(w => w.gender_target === 'female').length}`);
    console.log(`   Men's workouts: ${targetedWorkouts.filter(w => w.gender_target === 'male').length}`);
    console.log(`   Unisex workouts: ${targetedWorkouts.filter(w => w.gender_target === 'both').length}`);
    
    // Show duration summary
    const totalMinutes = targetedWorkouts.reduce((sum, w) => sum + w.total_duration, 0) / 60;
    console.log(`   Total video content: ${totalMinutes.toFixed(1)} minutes`);
    
    // Show Digital Ocean cover usage
    console.log('\n🌊 Digital Ocean Cover Images Used for Targeted Workouts:');
    console.log(`   Total cover images available: ${uploadedCovers.length}`);
    console.log(`   Men-focused covers: ${coverCategories.male.length}`);
    console.log(`   Women-focused covers: ${coverCategories.female.length}`);
    console.log(`   Neutral covers: ${coverCategories.both.length}`);
    
    console.log('\n🎯 Targeted Workout Thumbnails (Using Same Assets as Programs):');
    console.log('   Sample targeted workout thumbnails:');
    targetedWorkouts.slice(0, 4).forEach(workout => {
      console.log(`     ${workout.title}: ${workout.thumbnail_key}`);
    });
    
    console.log('\n🔗 Sample Digital Ocean URLs:');
    targetedWorkouts.slice(0, 3).forEach(workout => {
      console.log(`   ${workout.title}: https://my-fitness-app.fra1.digitaloceanspaces.com/${workout.thumbnail_key}`);
    });
    
    console.log('\n💡 NOTE: Targeted workouts are using the SAME cover images as the main programs.');
    console.log('   This ensures consistency and reuses existing Digital Ocean Spaces content.');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('targeted_workouts', null, {});
    console.log('🗑️  All targeted workouts deleted');
  }
};