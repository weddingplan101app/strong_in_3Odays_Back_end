// src/seeders/20241215000006-demo-targeted-workout-clips.js
'use strict';
const { v4: uuidv4 } = require('uuid');

// Reuse the same assets from programs and workout videos
const uploadedVideos = [
  'video/5114742_Running_Runner_3840x2160.mp4',
  'video/6003946_Man_Woman_3840x2160.mp4', 
  'video/Q_Woman_Fitness_2160x3840.mp4',
  'video/6003937_Man_Woman_3840x2160.mp4',
  'video/393687_Fitness_Gym_2048x1080.mp4',
  'video/4783798_Woman_Gym_1920x1080.mp4',
  'video/4783840_Woman_Gym_3840x2160.mp4',
  'video/6003962_Man_African_American_3840x2160.mp4'
];

const uploadedThumbnails = [
  'thumbnail/thum1.jpg',
  'thumbnail/thum2.jpg',
  'thumbnail/thum3.jpg',
  'thumbnail/thum4.jpg',
  'thumbnail/thum5.jpg',
  'thumbnail/thum6.jpg'
];

// Categorize videos based on content for better matching
const videoCategories = {
  male: [
    'video/5114742_Running_Runner_3840x2160.mp4',
    'video/6003962_Man_African_American_3840x2160.mp4'
  ],
  female: [
    'video/Q_Woman_Fitness_2160x3840.mp4',
    'video/4783798_Woman_Gym_1920x1080.mp4',
    'video/4783840_Woman_Gym_3840x2160.mp4'
  ],
  both: [
    'video/6003946_Man_Woman_3840x2160.mp4',
    'video/6003937_Man_Woman_3840x2160.mp4',
    'video/393687_Fitness_Gym_2048x1080.mp4'
  ]
};

module.exports = {
  async up(queryInterface, Sequelize) {
    // First, get all targeted workouts to create clips for them
    const [workouts] = await queryInterface.sequelize.query(
      `SELECT id, title, body_part, gender_target, clip_count, calories_burned FROM targeted_workouts ORDER BY sort_order`
    );

    if (workouts.length === 0) {
      console.log('⚠️  No targeted workouts found. Please run the targeted workouts seeder first.');
      return;
    }

    const targetedWorkoutClips = [];
    
    // Exercise libraries for different body parts
    const exerciseLibrary = {
      // Women's focused exercises
      women_abs: [
        { name: 'Crunches', instruction: 'Lie on your back with knees bent, lift shoulders using abs', tip: 'Exhale as you crunch' },
        { name: 'Leg Raises', instruction: 'Lie on back, keep legs straight and lift them up', tip: 'Keep lower back pressed to floor' },
        { name: 'Russian Twists', instruction: 'Sit with knees bent, twist torso side to side', tip: 'Engage your core throughout' },
        { name: 'Mountain Climbers', instruction: 'In plank position, alternate bringing knees to chest', tip: 'Keep hips level' },
        { name: 'Bicycle Crunches', instruction: 'Lie on back, alternate elbow to opposite knee', tip: 'Go slow for better control' },
        { name: 'Plank', instruction: 'Hold push-up position on forearms', tip: 'Keep body straight, don\'t sag' },
        { name: 'Flutter Kicks', instruction: 'Lie on back, alternate kicking legs up and down', tip: 'Keep legs straight' },
        { name: 'Reverse Crunches', instruction: 'Lie on back, bring knees toward chest', tip: 'Use lower abs to lift hips' },
        { name: 'Side Plank', instruction: 'Balance on one forearm, lift hips', tip: 'Don\'t let hips drop' },
        { name: 'Toe Touches', instruction: 'Lie on back, reach hands toward toes', tip: 'Keep neck relaxed' }
      ],
      
      women_arms: [
        { name: 'Arm Circles', instruction: 'Extend arms to sides, make small circles', tip: 'Keep shoulders relaxed' },
        { name: 'Tricep Dips', instruction: 'Use chair or floor to dip body up and down', tip: 'Keep elbows pointing backward' },
        { name: 'Bicep Curls', instruction: 'Make fists and curl arms as if holding weights', tip: 'Squeeze at the top' },
        { name: 'Push-ups', instruction: 'Standard push-up or modified on knees', tip: 'Keep core tight' },
        { name: 'Shoulder Taps', instruction: 'In plank, tap opposite shoulder', tip: 'Keep hips stable' },
        { name: 'Arm Pulses', instruction: 'Extend arms, pulse up and down', tip: 'Small movements' },
        { name: 'Wrist Circles', instruction: 'Rotate wrists in circles', tip: 'Good for flexibility' },
        { name: 'Overhead Press', instruction: 'Press imaginary weights overhead', tip: 'Don\'t lock elbows' }
      ],
      
      women_glutes: [
        { name: 'Glute Bridges', instruction: 'Lie on back, lift hips upward', tip: 'Squeeze glutes at the top' },
        { name: 'Squats', instruction: 'Stand, lower as if sitting in a chair', tip: 'Keep chest up' },
        { name: 'Lunges', instruction: 'Step forward, lower until both knees are bent', tip: 'Front knee behind toes' },
        { name: 'Donkey Kicks', instruction: 'On hands and knees, kick leg upward', tip: 'Squeeze glute at top' },
        { name: 'Fire Hydrants', instruction: 'On hands and knees, lift leg to side', tip: 'Keep core engaged' },
        { name: 'Side Lunges', instruction: 'Step to side, lower into lunge', tip: 'Keep other leg straight' },
        { name: 'Calf Raises', instruction: 'Stand on toes, lift heels', tip: 'Slow and controlled' },
        { name: 'Sumo Squats', instruction: 'Wide stance squats', tip: 'Point toes slightly outward' }
      ],
      
      // Men's focused exercises
      men_chest: [
        { name: 'Push-ups', instruction: 'Standard push-up form', tip: 'Keep body in straight line' },
        { name: 'Wide Push-ups', instruction: 'Hands wider than shoulders', tip: 'Targets outer chest' },
        { name: 'Decline Push-ups', instruction: 'Feet elevated on chair', tip: 'Targets upper chest' },
        { name: 'Diamond Push-ups', instruction: 'Hands close together in diamond shape', tip: 'Focus on triceps' },
        { name: 'Plyo Push-ups', instruction: 'Push with enough force to lift hands', tip: 'Explosive movement' },
        { name: 'Archer Push-ups', instruction: 'Shift weight from side to side', tip: 'Great for chest expansion' },
        { name: 'Incline Push-ups', instruction: 'Hands on elevated surface', tip: 'Easier variation' },
        { name: 'Clap Push-ups', instruction: 'Push up and clap', tip: 'Advanced, build power' }
      ],
      
      men_arms: [
        { name: 'Bicep Curls', instruction: 'Curl imaginary weights', tip: 'Squeeze bicep at top' },
        { name: 'Tricep Dips', instruction: 'Use chair for dips', tip: 'Keep elbows pointing back' },
        { name: 'Hammer Curls', instruction: 'Curl with palms facing each other', tip: 'Works forearms too' },
        { name: 'Tricep Extensions', instruction: 'Extend arms overhead', tip: 'Keep elbows close to head' },
        { name: 'Concentration Curls', instruction: 'One arm at a time, elbow on thigh', tip: 'Maximum bicep contraction' },
        { name: 'Skull Crushers', instruction: 'Lie down, lower weight toward forehead', tip: 'Keep elbows stable' },
        { name: 'Reverse Curls', instruction: 'Palms facing down, curl up', tip: 'Targets brachialis' },
        { name: 'Close-grip Push-ups', instruction: 'Hands close together', tip: 'Focus on triceps' }
      ],
      
      // Unisex/Cardio exercises
      cardio: [
        { name: 'High Knees', instruction: 'Run in place, bringing knees up high', tip: 'Pump arms for momentum' },
        { name: 'Jumping Jacks', instruction: 'Jump feet out while raising arms', tip: 'Full range of motion' },
        { name: 'Burpees', instruction: 'Squat, kick back, push-up, jump up', tip: 'Maintain good form' },
        { name: 'Mountain Climbers', instruction: 'In plank, alternate knees to chest', tip: 'Fast but controlled' },
        { name: 'Jump Squats', instruction: 'Squat then explode upward', tip: 'Land softly' },
        { name: 'Butt Kicks', instruction: 'Run in place, kick heels to glutes', tip: 'Quick foot turnover' },
        { name: 'Skaters', instruction: 'Leap side to side like speed skater', tip: 'Reach opposite hand to foot' },
        { name: 'Fast Feet', instruction: 'Quick small steps in place', tip: 'Stay on balls of feet' }
      ],
      
      core: [
        { name: 'Plank', instruction: 'Hold push-up position on forearms', tip: 'Don\'t let hips sag' },
        { name: 'Side Plank', instruction: 'Balance on one forearm', tip: 'Keep body in straight line' },
        { name: 'Dead Bug', instruction: 'Lie on back, alternate arm and leg extensions', tip: 'Keep lower back flat' },
        { name: 'Bird Dog', instruction: 'On hands and knees, extend opposite arm and leg', tip: 'Keep core tight' },
        { name: 'Superman', instruction: 'Lie on stomach, lift arms and legs', tip: 'Squeeze glutes and back' },
        { name: 'Leg Raises', instruction: 'Lie on back, lift legs up and down', tip: 'Control the descent' },
        { name: 'Russian Twists', instruction: 'Sit with knees bent, twist torso', tip: 'Keep back straight' },
        { name: 'Bicycle Crunches', instruction: 'Alternate elbow to opposite knee', tip: 'Slow and controlled' }
      ]
    };
    
    // Helper function to get exercises based on workout
    const getExercisesForWorkout = (workout, index) => {
      const { body_part, gender_target, clip_count } = workout;
      
      let exerciseSet = [];
      
      // Determine which exercise set to use
      if (gender_target === 'female') {
        if (body_part === 'abs') exerciseSet = exerciseLibrary.women_abs;
        else if (body_part === 'arms') exerciseSet = exerciseLibrary.women_arms;
        else if (body_part === 'glutes') exerciseSet = exerciseLibrary.women_glutes;
        else exerciseSet = exerciseLibrary.cardio;
      } else if (gender_target === 'male') {
        if (body_part === 'chest') exerciseSet = exerciseLibrary.men_chest;
        else if (body_part === 'arms') exerciseSet = exerciseLibrary.men_arms;
        else exerciseSet = exerciseLibrary.cardio;
      } else {
        // Unisex
        if (body_part === 'abs' || body_part === 'core') exerciseSet = exerciseLibrary.core;
        else exerciseSet = exerciseLibrary.cardio;
      }
      
      // Return required number of exercises, repeating if needed
      const exercises = [];
      for (let i = 0; i < clip_count; i++) {
        const exerciseIndex = i % exerciseSet.length;
        exercises.push(exerciseSet[exerciseIndex]);
      }
      
      return exercises;
    };

    // Helper to get appropriate video for targeted workout
    function getVideoForTargetedWorkout(workout, clipOrder) {
      let videoPool = [];
      
      // Choose video pool based on gender target
      if (workout.gender_target === 'male') {
        videoPool = videoCategories.male.length > 0 ? videoCategories.male : videoCategories.both;
      } else if (workout.gender_target === 'female') {
        videoPool = videoCategories.female.length > 0 ? videoCategories.female : videoCategories.both;
      } else {
        videoPool = videoCategories.both;
      }
      
      // If no suitable videos found, use all videos
      if (videoPool.length === 0) {
        videoPool = uploadedVideos;
      }
      
      // Use deterministic index based on workout id and clip order
      const videoIndex = (workout.id.charCodeAt(0) + clipOrder) % videoPool.length;
      return videoPool[videoIndex];
    }
    
    // Helper to get thumbnail for targeted workout
    function getThumbnailForTargetedWorkout(workout, clipOrder) {
      // Use a different algorithm for thumbnails to vary them from videos
      const thumbnailIndex = (workout.id.charCodeAt(1) + clipOrder * 13) % uploadedThumbnails.length;
      return uploadedThumbnails[thumbnailIndex];
    }
    
    // Create clips for each workout
    workouts.forEach((workout, workoutIndex) => {
      const exercises = getExercisesForWorkout(workout, workoutIndex);
      const caloriesPerClip = Math.floor(workout.calories_burned / workout.clip_count);
      
      for (let i = 0; i < workout.clip_count; i++) {
        const exercise = exercises[i];
        const clipOrder = i + 1;
        
        // Get video and thumbnail using the same assets as programs
        const videoKey = getVideoForTargetedWorkout(workout, clipOrder);
        const thumbnailKey = getThumbnailForTargetedWorkout(workout, clipOrder);
        
        targetedWorkoutClips.push({
          id: uuidv4(),
          targeted_workout_id: workout.id,
          clip_order: clipOrder,
          title: `${exercise.name} - ${clipOrder}/${workout.clip_count}`,
          description: `30-second ${exercise.name.toLowerCase()} for your ${workout.title.toLowerCase()}`,
          exercise: exercise.name,
          duration: 30,
          video_key: videoKey,
          thumbnail_key: thumbnailKey,
          instructions: exercise.instruction,
          tips: exercise.tip,
          calories_burned: caloriesPerClip,
          is_active: true,
          original_video_asset_id: null,
          thumbnail_asset_id: null,
          created_at: new Date(),
          updated_at: new Date()
        });
      }
    });
    
    await queryInterface.bulkInsert('targeted_workout_clips', targetedWorkoutClips);
    
    console.log(`✅ Seeded ${targetedWorkoutClips.length} targeted workout clips (30-second exercises)`);
    console.log(`📊 Clips per workout: ${(targetedWorkoutClips.length / workouts.length).toFixed(1)} average`);
    
    // Show summary
    console.log('\n📋 Clip Distribution by Workout Type:');
    const workoutTypes = {};
    workouts.forEach(workout => {
      const type = workout.gender_target === 'female' ? 'Women' : 
                   workout.gender_target === 'male' ? 'Men' : 'Unisex';
      if (!workoutTypes[type]) workoutTypes[type] = 0;
      workoutTypes[type] += workout.clip_count;
    });
    
    Object.entries(workoutTypes).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} clips (${count * 30 / 60} minutes total)`);
    });
    
    // Show sample clips from first workout
    console.log('\n🎬 Sample Clips Structure (Using Same Assets as Programs):');
    const firstWorkout = workouts[0];
    const firstWorkoutClips = targetedWorkoutClips
      .filter(c => c.targeted_workout_id === firstWorkout.id)
      .slice(0, 3);
    
    console.log(`   Workout: ${firstWorkout.title} (${firstWorkout.gender_target})`);
    console.log(`   Total clips: ${firstWorkout.clip_count} (${firstWorkout.clip_count * 30}s = ${firstWorkout.total_duration/60}min)`);
    console.log(`   Sample clips with Digital Ocean assets:`);
    firstWorkoutClips.forEach((clip, i) => {
      console.log(`     ${i+1}. ${clip.exercise}`);
      console.log(`        Video: ${clip.video_key}`);
      console.log(`        Thumbnail: ${clip.thumbnail_key}`);
    });
    
    // Show all assets being used
    console.log('\n🌊 Digital Ocean Assets Used for Targeted Workouts:');
    console.log(`   Total video assets: ${uploadedVideos.length}`);
    console.log(`   Total thumbnail assets: ${uploadedThumbnails.length}`);
    console.log(`   Videos categorized for men: ${videoCategories.male.length}`);
    console.log(`   Videos categorized for women: ${videoCategories.female.length}`);
    console.log(`   Videos categorized as unisex: ${videoCategories.both.length}`);
    
    console.log('\n🔗 Sample Digital Ocean URLs (same as programs):');
    console.log(`   Video: https://my-fitness-app.fra1.digitaloceanspaces.com/${uploadedVideos[0]}`);
    console.log(`   Thumbnail: https://my-fitness-app.fra1.digitaloceanspaces.com/${uploadedThumbnails[0]}`);
    
    console.log('\n💡 NOTE: Targeted workouts are using the SAME video/thumbnail assets as the main programs.');
    console.log('   This ensures consistency and reuses existing Digital Ocean Spaces content.');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('targeted_workout_clips', null, {});
    console.log('🗑️  All targeted workout clips deleted');
  }
};