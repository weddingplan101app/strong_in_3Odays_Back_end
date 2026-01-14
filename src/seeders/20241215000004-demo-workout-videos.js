// src/seeders/20241215000004-demo-workout-videos-fixed.js
'use strict';
const { v4: uuidv4 } = require('uuid');

// Your uploaded video files from Digital Ocean Spaces
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

// Your uploaded thumbnail files from Digital Ocean Spaces
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
    'video/5114742_Running_Runner_3840x2160.mp4',    // Running - neutral but good for men
    'video/6003962_Man_African_American_3840x2160.mp4' // Man specifically
  ],
  female: [
    'video/Q_Woman_Fitness_2160x3840.mp4',           // Woman fitness
    'video/4783798_Woman_Gym_1920x1080.mp4',         // Woman in gym
    'video/4783840_Woman_Gym_3840x2160.mp4'          // Woman in gym
  ],
  both: [
    'video/6003946_Man_Woman_3840x2160.mp4',         // Man and woman together
    'video/6003937_Man_Woman_3840x2160.mp4',         // Man and woman together  
    'video/393687_Fitness_Gym_2048x1080.mp4'         // General gym scene
  ]
};

module.exports = {
  async up(queryInterface, Sequelize) {
    // Get all programs to create workout videos for each
    const [programs] = await queryInterface.sequelize.query(
      `SELECT id, slug, name, duration, gender_target, equipment_required, difficulty FROM programs ORDER BY sort_order`
    );

    if (programs.length === 0) {
      console.log('⚠️  No programs found. Please run the program seeder first.');
      return;
    }

    const workoutVideos = [];
    
    // Common workout titles by program type
    const workoutTitles = {
      // Beginner Men - Focus on strength, fat loss, chest/arms (PRD: Men 18-55)
      '30-day-beginner-men': [
        'Day 1: Full Body Strength Basics',
        'Day 2: Chest & Arms Foundation',
        'Day 3: Core & Stability Training',
        'Day 4: Leg Power & Endurance',
        'Day 5: Upper Body Sculpt',
        'Day 6: Fat Burn Circuit',
        'Day 7: Strength & Recovery',
        'Day 8: Push-up Challenge',
        'Day 9: Arm Definition Workout',
        'Day 10: Core Power Session',
        'Day 11: Full Body Burn',
        'Day 12: Chest Expansion',
        'Day 13: Arm Strength Builder',
        'Day 14: Metabolic Boost',
        'Day 15: Strength Progress Check',
        'Day 16: Advanced Push-ups',
        'Day 17: Bicep & Tricep Focus',
        'Day 18: Core Strength Max',
        'Day 19: Leg Day Intensity',
        'Day 20: Upper Body Power',
        'Day 21: Fat Burning HIIT',
        'Day 22: Chest Definition',
        'Day 23: Arm Sculpting',
        'Day 24: Full Body Challenge',
        'Day 25: Strength Endurance',
        'Day 26: Power Push Day',
        'Day 27: Arm & Shoulder Focus',
        'Day 28: Core Finale',
        'Day 29: Full Body Max Out',
        'Day 30: 30-Day Celebration & Results'
      ],
      
      // Beginner Women - Focus on belly fat, toning, curves (PRD: Women 18-55)
      '30-day-beginner-women': [
        'Day 1: Gentle Start & Toning Basics',
        'Day 2: Belly Fat Focus',
        'Day 3: Arm Toning Session',
        'Day 4: Glute & Leg Sculpt',
        'Day 5: Full Body Tone',
        'Day 6: Core Strength for Women',
        'Day 7: Active Recovery & Stretch',
        'Day 8: Belly Fat Burner',
        'Day 9: Arm Definition Workout',
        'Day 10: Curves & Shape Focus',
        'Day 11: Total Body Tone',
        'Day 12: Lower Belly Focus',
        'Day 13: Arm & Back Toning',
        'Day 14: Glute Activation',
        'Day 15: Progress Check & Motivation',
        'Day 16: Advanced Belly Fat Burn',
        'Day 17: Sleek Arm Sculpt',
        'Day 18: Leg & Glute Definition',
        'Day 19: Full Body Burn',
        'Day 20: Core & Posture',
        'Day 21: Toning HIIT',
        'Day 22: Waistline Focus',
        'Day 23: Arm Strength & Tone',
        'Day 24: Booty Building',
        'Day 25: Total Body Sculpt',
        'Day 26: Belly Fat Finale',
        'Day 27: Arm Definition Max',
        'Day 28: Curves & Shape Final',
        'Day 29: Full Body Transformation',
        'Day 30: 30-Day Results Celebration'
      ],
      
      // Dumbbell Men - Focus on strength building with equipment
      '30-day-dumbbell-men': [
        'Day 1: Dumbbell Strength Basics',
        'Day 2: Chest Press Variations',
        'Day 3: Bicep & Tricep Focus',
        'Day 4: Shoulder Power',
        'Day 5: Back Strength Builder',
        'Day 6: Full Body Dumbbell',
        'Day 7: Active Recovery',
        'Day 8: Progressive Overload',
        'Day 9: Arm Mass Building',
        'Day 10: Chest Expansion',
        'Day 11: Shoulder Definition',
        'Day 12: Back Width & Thickness',
        'Day 13: Arm Strength Max',
        'Day 14: Full Body Power',
        'Day 15: Strength Assessment',
        'Day 16: Advanced Chest Work',
        'Day 17: Arm Size & Strength',
        'Day 18: Shoulder Cap Building',
        'Day 19: Back Development',
        'Day 20: Full Body Strength',
        'Day 21: Chest & Arm Superset',
        'Day 22: Shoulder & Back Focus',
        'Day 23: Arm Definition Peak',
        'Day 24: Full Body Mass',
        'Day 25: Strength Endurance',
        'Day 26: Power Building',
        'Day 27: Final Strength Push',
        'Day 28: Muscle Definition',
        'Day 29: Strength Finale',
        'Day 30: 30-Day Strength Results'
      ],
      
      // Dumbbell Women - Focus on toning with equipment
      '30-day-dumbbell-women': [
        'Day 1: Dumbbell Toning Basics',
        'Day 2: Arm Sculpt with Weights',
        'Day 3: Glute & Leg Toning',
        'Day 4: Full Body Dumbbell Tone',
        'Day 5: Back & Posture Focus',
        'Day 6: Metabolic Boost',
        'Day 7: Recovery & Mobility',
        'Day 8: Progressive Toning',
        'Day 9: Arm Definition Work',
        'Day 10: Leg Sculpting',
        'Day 11: Full Body Burn',
        'Day 12: Shoulder & Back Tone',
        'Day 13: Arm Strength & Shape',
        'Day 14: Glute Activation',
        'Day 15: Toning Progress Check',
        'Day 16: Advanced Arm Sculpt',
        'Day 17: Leg Definition Max',
        'Day 18: Full Body Definition',
        'Day 19: Metabolic Conditioning',
        'Day 20: Total Body Tone',
        'Day 21: Arm & Shoulder Focus',
        'Day 22: Leg & Glute Final',
        'Day 23: Full Body Sculpt',
        'Day 24: Strength & Tone Combo',
        'Day 25: Metabolic Finale',
        'Day 26: Definition Max',
        'Day 27: Total Body Transformation',
        'Day 28: Final Toning Push',
        'Day 29: Results Preview',
        'Day 30: 30-Day Celebration'
      ]
    };
    
    // Helper to get random video for program
    function getRandomVideoForProgram(program, day) {
      // Combine gender-specific videos with neutral ones
      const genderVideos = videoCategories[program.gender_target] || [];
      const allVideos = [...genderVideos, ...videoCategories.both];
      
      if (allVideos.length === 0) {
        return uploadedVideos[day % uploadedVideos.length];
      }
      
      // Use day to get consistent but varied selection
      return allVideos[(program.id.charCodeAt(0) + day) % allVideos.length];
    }
    
    // Helper to get random thumbnail
    function getRandomThumbnail(program, day) {
      // Use a different algorithm for thumbnails to vary them from videos
      const thumbnailIndex = (program.id.charCodeAt(1) + day * 13) % uploadedThumbnails.length;
      return uploadedThumbnails[thumbnailIndex];
    }
    
    // Helper to get welcome video (should be motivational/introductory)
    function getWelcomeVideo(program) {
      // For welcome videos, prefer "both" category or motivational videos
      const welcomeVideos = [...videoCategories.both, ...uploadedVideos];
      const index = program.id.charCodeAt(0) % welcomeVideos.length;
      return welcomeVideos[index];
    }
    
    // Helper to get welcome thumbnail
    function getWelcomeThumbnail(program) {
      const index = program.id.charCodeAt(1) % uploadedThumbnails.length;
      return uploadedThumbnails[index];
    }
    
    // Create workout videos for each program
    programs.forEach(program => {
      // Welcome Video (Day 0)
      const genderText = program.gender_target === 'male' ? 'Men' : 
                        program.gender_target === 'female' ? 'Women' : 'Everyone';
      
      workoutVideos.push({
        id: uuidv4(),
        program_id: program.id,
        day: 0,
        title: `Welcome to ${program.name}`,
        description: `Your ${program.duration}-day journey to becoming fitter and stronger. Designed specifically for ${genderText}.`,
        // ✅ Random but consistent welcome video
        video_key: getWelcomeVideo(program),
        // ✅ Random but consistent welcome thumbnail
        thumbnail_key: getWelcomeThumbnail(program),
        duration: 180, // 3 minutes welcome video
        difficulty: program.difficulty || 'beginner',
        calories_burned: 0,
        is_welcome_video: true,
        is_active: true,
        sort_order: 0,
        muscle_groups: program.gender_target === 'male' ? ['introduction', 'motivation', 'strength'] : 
                       program.gender_target === 'female' ? ['introduction', 'motivation', 'toning'] : 
                       ['introduction', 'motivation'],
        has_adaptive_streaming: false,
        streaming_manifest_key: null,
        original_video_asset_id: null,
        thumbnail_asset_id: null,
        created_at: new Date(),
        updated_at: new Date()
      });
      
      // Daily Workout Videos (Day 1 to program duration)
      const titles = workoutTitles[program.slug] || generateDefaultTitles(program);
      
      for (let day = 1; day <= program.duration; day++) {
        const title = titles[day - 1] || `Day ${day}: ${program.name} Workout`;
        
        // Calculate difficulty progression
        let dayDifficulty = program.difficulty || 'beginner';
        if (day > program.duration * 0.7 && program.difficulty === 'beginner') {
          dayDifficulty = 'intermediate';
        } else if (day > program.duration * 0.5 && program.difficulty === 'intermediate') {
          dayDifficulty = 'advanced';
        }
        
        // Calculate duration based on program type (20-30 minutes as per PRD)
        const baseDuration = program.equipment_required ? 1800 : 1500; // 30 mins for equipment, 25 mins for bodyweight
        const duration = baseDuration + (day * 10); // Increase slightly each day
        
        // Calculate calories based on program and gender
        let calories = 200;
        if (program.gender_target === 'male') calories += 50;
        if (program.equipment_required) calories += 50;
        calories += (day * 5); // Increase with progression
        
        // Determine muscle groups based on program focus
        let muscleGroups = [];
        if (program.gender_target === 'male') {
          if (day % 3 === 0) muscleGroups = ['chest', 'arms', 'shoulders'];
          else if (day % 3 === 1) muscleGroups = ['legs', 'glutes', 'core'];
          else muscleGroups = ['back', 'arms', 'full_body'];
        } else { // female
          if (day % 3 === 0) muscleGroups = ['abs', 'core', 'waist'];
          else if (day % 3 === 1) muscleGroups = ['arms', 'back', 'toning'];
          else muscleGroups = ['legs', 'glutes', 'curves'];
        }
        
        workoutVideos.push({
          id: uuidv4(),
          program_id: program.id,
          day: day,
          title: title,
          description: `Day ${day} of ${program.duration}: ${program.description?.substring(0, 100) || 'Daily workout'}...`,
          // ✅ Random but consistent video for this program/day
          video_key: getRandomVideoForProgram(program, day),
          // ✅ Random but consistent thumbnail for this program/day
          thumbnail_key: getRandomThumbnail(program, day),
          duration: duration,
          difficulty: dayDifficulty,
          calories_burned: calories,
          is_welcome_video: false,
          is_active: true,
          sort_order: day,
          muscle_groups: muscleGroups,
          has_adaptive_streaming: false,
          streaming_manifest_key: null,
          original_video_asset_id: null,
          thumbnail_asset_id: null,
          created_at: new Date(),
          updated_at: new Date()
        });
      }
    });
    
    await queryInterface.bulkInsert('workout_videos', workoutVideos);
    
    console.log(`✅ Seeded ${workoutVideos.length} workout videos across ${programs.length} programs`);
    
    // Summary by program type
    console.log('\n📹 Workout Video Summary:');
    console.log('   Beginner Programs (Men/Women):');
    const beginnerPrograms = programs.filter(p => p.difficulty === 'beginner' && !p.equipment_required && p.duration === 30);
    beginnerPrograms.forEach(p => {
      const videos = workoutVideos.filter(v => v.program_id === p.id);
      console.log(`     ${p.name}: ${videos.length} videos (${videos.filter(v => v.is_welcome_video).length} welcome, ${videos.filter(v => !v.is_welcome_video).length} daily)`);
    });
    
    console.log('   With Equipment Programs (Men/Women):');
    const equipmentPrograms = programs.filter(p => p.equipment_required && p.duration === 30);
    equipmentPrograms.forEach(p => {
      const videos = workoutVideos.filter(v => v.program_id === p.id);
      console.log(`     ${p.name}: ${videos.length} videos (${videos.filter(v => v.is_welcome_video).length} welcome, ${videos.filter(v => !v.is_welcome_video).length} daily)`);
    });
    
    // Total statistics
    const totalMinutes = workoutVideos.reduce((sum, v) => sum + v.duration, 0) / 60;
    const totalHours = totalMinutes / 60;
    
    console.log('\n📈 Total Video Content:');
    console.log(`   Total videos: ${workoutVideos.length}`);
    console.log(`   Total duration: ${totalMinutes.toFixed(0)} minutes (${totalHours.toFixed(1)} hours)`);
    console.log(`   Welcome videos: ${workoutVideos.filter(v => v.is_welcome_video).length}`);
    console.log(`   Daily workouts: ${workoutVideos.filter(v => !v.is_welcome_video).length}`);
    
    // Digital Ocean Assets Summary
    console.log('\n🌊 Digital Ocean Assets:');
    console.log(`   Video files: ${uploadedVideos.length}`);
    console.log(`   Thumbnail files: ${uploadedThumbnails.length}`);
    console.log(`   Male-focused videos: ${videoCategories.male.length}`);
    console.log(`   Female-focused videos: ${videoCategories.female.length}`);
    console.log(`   Neutral videos: ${videoCategories.both.length}`);
    
    console.log('\n🔗 Test URLs (ensure files are public):');
    console.log('   Sample video: https://my-fitness-app.fra1.digitaloceanspaces.com/video/5114742_Running_Runner_3840x2160.mp4');
    console.log('   Sample thumbnail: https://my-fitness-app.fra1.digitaloceanspaces.com/thumbnail/thum1.jpg');
    
    console.log('\n💡 TIP: If URLs return AccessDenied, make files public in Digital Ocean Console:');
    console.log('   1. Go to Spaces → your bucket');
    console.log('   2. Select video/ and thumbnail/ folders');
    console.log('   3. Click "More" → "Make Public"');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('workout_videos', null, {});
    console.log('🗑️  All workout videos deleted');
  }
};

// Helper function for programs without predefined titles
function generateDefaultTitles(program) {
  const titles = [];
  for (let day = 1; day <= program.duration; day++) {
    titles.push(`Day ${day}: ${program.name} Workout`);
  }
  return titles;
}