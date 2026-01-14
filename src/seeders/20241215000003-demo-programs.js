// src/seeders/20241215000003-demo-programs.js
'use strict';
const { v4: uuidv4 } = require('uuid');

// Your uploaded cover images from Digital Ocean Spaces
const uploadedCovers = [
  'cover/plus-size-person-working-out.jpg',
  'cover/portrait-athletic-man-doing-box-jump-exercise-crossfit-sport-healt.jpg',
  'cover/handsome-black-man-is-engaged-gym.jpg', // Fixed the filename typo
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
    // Create fitness programs based on PRD requirements
    const programs = [
      // ========== BEGINNER PROGRAMS (30-day, bodyweight) - PRD Section 8 ==========
      {
        id: uuidv4(),
        slug: '30-day-beginner-men',
        name: '30 Day Beginner Challenge for Men',
        description: 'Perfect for men starting their fitness journey. No equipment needed, just 20-30 minutes daily to build strength, lose fat, and gain confidence.',
        duration: 30,
        difficulty: 'beginner',
        gender_target: 'male', // ✅ PRD: Men specific
        equipment_required: false, // ✅ PRD: Bodyweight only
        // ✅ Using Digital Ocean cover
        cover_image_url: 'cover/handsome-black-man-is-engaged-gym.jpg',
        status: 'published',
        is_active: true,
        sort_order: 1,
        enrollment_count: 1850,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        slug: '30-day-beginner-women',
        name: '30 Day Beginner Challenge for Women',
        description: 'Perfect for women starting their fitness journey. Simple, effective workouts to tone your body, burn belly fat, and build confidence at home.',
        duration: 30,
        difficulty: 'beginner',
        gender_target: 'female', // ✅ PRD: Women specific
        equipment_required: false, // ✅ PRD: Bodyweight only
        // ✅ Using Digital Ocean cover
        cover_image_url: 'cover/beautiful-black-girl-is-engaged-gym.jpg',
        status: 'published',
        is_active: true,
        sort_order: 2,
        enrollment_count: 2350,
        created_at: new Date(),
        updated_at: new Date()
      },

      // ========== WITH EQUIPMENT PROGRAMS (30-day, dumbbell) - PRD Section 8 ==========
      {
        id: uuidv4(),
        slug: '30-day-dumbbell-men',
        name: '30 Day Dumbbell Strength for Men',
        description: 'Take your fitness to the next level with dumbbells. Build serious muscle, strength, and definition with this progressive 30-day program.',
        duration: 30,
        difficulty: 'intermediate',
        gender_target: 'male', // ✅ PRD: Men specific
        equipment_required: true, // ✅ PRD: Dumbbell required
        // ✅ Using Digital Ocean cover - man with dumbbells
        cover_image_url: 'cover/side-view-man-training-with-dumbbells.jpg',
        status: 'published',
        is_active: true,
        sort_order: 3,
        enrollment_count: 940,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        slug: '30-day-dumbbell-women',
        name: '30 Day Dumbbell Tone for Women',
        description: 'Sculpt and tone your entire body using dumbbells. Perfect for women who want to build lean muscle, boost metabolism, and get stronger.',
        duration: 30,
        difficulty: 'intermediate',
        gender_target: 'female', // ✅ PRD: Women specific
        equipment_required: true, // ✅ PRD: Dumbbell required
        // ✅ Using Digital Ocean cover - woman training outdoors
        cover_image_url: 'cover/full-shot-woman-training-outdoors.jpg',
        status: 'published',
        is_active: true,
        sort_order: 4,
        enrollment_count: 1120,
        created_at: new Date(),
        updated_at: new Date()
      },

      // ========== ADDITIONAL PROGRAMS (Aligned with PRD user personas) ==========
      {
        id: uuidv4(),
        slug: '15-day-fat-loss-men',
        name: '15 Day Fat Loss for Men',
        description: 'High-intensity workouts designed specifically for men to maximize fat burning, boost metabolism, and reveal muscle definition.',
        duration: 15,
        difficulty: 'intermediate',
        gender_target: 'male', // ✅ PRD: Men focus on fat loss
        equipment_required: false,
        // ✅ Using Digital Ocean cover - athletic man
        cover_image_url: 'cover/athletic-man-practicing-gymnastics-keep-fit.jpg',
        status: 'published',
        is_active: true,
        sort_order: 5,
        enrollment_count: 1280,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        slug: '21-day-toning-women',
        name: '21 Day Toning Challenge for Women',
        description: 'Target belly fat, tone arms, and sculpt curves with this 21-day program designed specifically for women. See results in just 3 weeks!',
        duration: 21,
        difficulty: 'beginner',
        gender_target: 'female', // ✅ PRD: Women focus on toning
        equipment_required: false,
        // ✅ Using Digital Ocean cover - plus size person (inclusive)
        cover_image_url: 'cover/plus-size-person-working-out.jpg',
        status: 'published',
        is_active: true,
        sort_order: 6,
        enrollment_count: 1950,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        slug: '21-day-upper-body-men',
        name: '21 Day Upper Body Builder for Men',
        description: 'Focus on chest, arms, back, and shoulders. Build definition and strength with targeted workouts designed for men.',
        duration: 21,
        difficulty: 'intermediate',
        gender_target: 'male', // ✅ PRD: Men focus on chest/arms
        equipment_required: false,
        // ✅ Using Digital Ocean cover - man doing exercise in gym
        cover_image_url: 'cover/full-shot-man-doing-exercise-gym.jpg',
        status: 'published',
        is_active: true,
        sort_order: 7,
        enrollment_count: 870,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        slug: '14-day-curve-sculptor',
        name: '14 Day Curve Sculptor for Women',
        description: 'Shape your glutes, tone your legs, and create beautiful curves with this targeted 14-day program designed for women.',
        duration: 14,
        difficulty: 'beginner',
        gender_target: 'female', // ✅ PRD: Women focus on curves
        equipment_required: false,
        // ✅ Using Digital Ocean cover - woman training (alternative)
        cover_image_url: 'cover/full-shot-woman-training-outdoors.jpg',
        status: 'published',
        is_active: true,
        sort_order: 8,
        enrollment_count: 1420,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        slug: '7-day-abs-challenge',
        name: '7 Day Abs Challenge',
        description: 'Get visible abs in just 7 days! Intense core workouts to strengthen your abs, obliques, and lower back.',
        duration: 7,
        difficulty: 'intermediate',
        gender_target: 'both', // Both can benefit from abs
        equipment_required: false,
        // ✅ Using Digital Ocean cover - neutral athlete
        cover_image_url: 'cover/side-view-athlete-holding-weights-with-copy-space.jpg',
        status: 'published',
        is_active: true,
        sort_order: 9,
        enrollment_count: 3100,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        slug: '30-day-advanced-strength',
        name: '30 Day Advanced Strength',
        description: 'For experienced fitness enthusiasts. Progressive overload training to build maximum strength and muscle.',
        duration: 30,
        difficulty: 'advanced',
        gender_target: 'both', // Advanced users of both genders
        equipment_required: true,
        // ✅ Using Digital Ocean cover - athletic man doing advanced exercise
        cover_image_url: 'cover/portrait-athletic-man-doing-box-jump-exercise-crossfit-sport-healt.jpg',
        status: 'published',
        is_active: true,
        sort_order: 10,
        enrollment_count: 520,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];
    
    await queryInterface.bulkInsert('programs', programs);
    
    console.log(`✅ Seeded ${programs.length} fitness programs based on PRD requirements`);
    
    // New: Digital Ocean cover usage
    console.log('\n🌊 Digital Ocean Cover Images Used:');
    console.log(`   Total cover images: ${uploadedCovers.length}`);
    console.log(`   Men-focused covers: ${coverCategories.male.length}`);
    console.log(`   Women-focused covers: ${coverCategories.female.length}`);
    console.log(`   Neutral covers: ${coverCategories.both.length}`);
    
    console.log('\n🔗 Sample Cover URLs (make sure they are public):');
    programs.slice(0, 3).forEach(program => {
      console.log(`   ${program.name}: https://my-fitness-app.fra1.digitaloceanspaces.com/${program.cover_image_url}`);
    });
    
    console.log('\n📊 Program Breakdown (PRD Section 8):');
    console.log('   BEGINNER PROGRAMS (30-day, bodyweight):');
    programs.filter(p => p.difficulty === 'beginner' && p.equipment_required === false && p.duration === 30).forEach((p, i) => {
      console.log(`     ${i+1}. ${p.name} - ${p.enrollment_count} enrollments`);
    });
    console.log('   WITH EQUIPMENT PROGRAMS (30-day, dumbbell):');
    programs.filter(p => p.equipment_required === true && p.duration === 30).forEach((p, i) => {
      console.log(`     ${i+1}. ${p.name} - ${p.enrollment_count} enrollments`);
    });
    console.log('   ADDITIONAL PROGRAMS:');
    programs.filter(p => !(p.difficulty === 'beginner' && p.equipment_required === false && p.duration === 30) && !(p.equipment_required === true && p.duration === 30)).forEach((p, i) => {
      console.log(`     ${i+1}. ${p.name} - ${p.duration} days - ${p.enrollment_count} enrollments`);
    });
    
    // Summary statistics
    const menPrograms = programs.filter(p => p.gender_target === 'male').length;
    const womenPrograms = programs.filter(p => p.gender_target === 'female').length;
    const bothPrograms = programs.filter(p => p.gender_target === 'both').length;
    const totalEnrollments = programs.reduce((sum, p) => sum + p.enrollment_count, 0);
    
    console.log('\n📈 Program Statistics:');
    console.log(`   Men's programs: ${menPrograms}`);
    console.log(`   Women's programs: ${womenPrograms}`);
    console.log(`   Both genders: ${bothPrograms}`);
    console.log(`   Total enrollments: ${totalEnrollments.toLocaleString()}`);
    
    console.log('\n💡 TIP: If cover images don\'t show, make sure they are public:');
    console.log('   1. Go to Digital Ocean Spaces → your bucket');
    console.log('   2. Select the `cover/` folder');
    console.log('   3. Click "More" → "Make Public"');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('programs', null, {});
    console.log('🗑️  All programs deleted');
  }
};