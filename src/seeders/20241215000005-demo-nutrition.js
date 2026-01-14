'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create nutrition tips and meals
    const nutritionItems = [
      {
        id: uuidv4(),
        day: null,
        title: 'Stay Hydrated',
        description: 'Drink at least 2-3 liters of water daily',
        detailed_content: 'Proper hydration is essential for muscle function, recovery, and fat loss. Drink water throughout the day, especially before and after workouts. Add lemon or cucumber for flavor if needed.',
        image_url: 'https://cdn.strongin30.com/nutrition/hydration.jpg',
        video_url: null,
        category: 'tip',
        calories: null,
        ingredients: ['2 large eggs', '2 slices whole wheat bread', '1 medium tomato', 'Pinch of salt', 'Optional: 1 teaspoon olive oil'],
      preparation_steps: ['Place eggs in a pot and cover with water', 'Bring to boil...'],
        prep_time: null,
        is_active: true,
        sort_order: 1,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        day: null,
        title: 'Eat Protein with Every Meal',
        description: 'Include protein in every meal to support muscle recovery',
        detailed_content: 'Aim for 20-30g of protein per meal. Protein helps repair muscle tissue, keeps you full longer, and boosts metabolism. Good sources: chicken, fish, eggs, beans, lentils, Greek yogurt.',
        image_url: 'https://cdn.strongin30.com/nutrition/protein.jpg',
        video_url: null,
        category: 'tip',
        calories: null,
          ingredients: ['½ cup rolled oats', '1 cup water or almond milk', '½ banana, sliced'],
      preparation_steps: ['Combine oats and liquid in a pot', 'Bring to simmer...'],
        prep_time: null,
        is_active: true,
        sort_order: 2,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        day: null,
        title: 'Eat More Vegetables',
        description: 'Fill half your plate with vegetables',
        detailed_content: 'Vegetables are packed with vitamins, minerals, and fiber. They help with recovery, reduce inflammation, and keep you full with minimal calories. Aim for a variety of colors.',
        image_url: 'https://cdn.strongin30.com/nutrition/vegetables.jpg',
        video_url: null,
        category: 'tip',
        calories: null,
          ingredients: ['½ cup rolled oats', '1 cup water or almond milk', '½ banana, sliced'],
      preparation_steps: ['Combine oats and liquid in a pot', 'Bring to simmer...'],
        prep_time: null,
        is_active: true,
        sort_order: 3,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        day: null,
        title: 'Control Portion Sizes',
        description: 'Use your hand as a portion guide',
        detailed_content: 'Protein: palm-sized portion\nVegetables: fist-sized portion\nCarbs: cupped hand portion\nFats: thumb-sized portion\nThis simple method works for most people.',
        image_url: 'https://cdn.strongin30.com/nutrition/portions.jpg',
        video_url: null,
        category: 'tip',
        calories: null,
         ingredients: ['½ cup rolled oats', '1 cup water or almond milk', '½ banana, sliced'],
      preparation_steps: ['Combine oats and liquid in a pot', 'Bring to simmer...'],
        prep_time: null,
        is_active: true,
        sort_order: 4,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        day: 1,
        title: 'Protein-Packed Nigerian Breakfast',
        description: 'Boiled eggs with whole wheat bread and sliced tomatoes',
        detailed_content: 'A balanced Nigerian breakfast that provides protein and complex carbs to start your day strong.',
        image_url: 'https://cdn.strongin30.com/nutrition/breakfast1.jpg',
        video_url: 'https://cdn.strongin30.com/nutrition/videos/breakfast1.mp4',
        category: 'breakfast',
        calories: 350,
        ingredients: ['2 large eggs', '2 slices whole wheat bread', '1 medium tomato', 'Pinch of salt', 'Optional: 1 teaspoon olive oil'],
        preparation_steps: [
          'Place eggs in a pot and cover with water',
          'Bring to boil, then reduce heat and simmer for 8-10 minutes',
          'Remove eggs and place in cold water',
          'Peel eggs and slice in half',
          'Toast bread slices lightly',
          'Slice tomato',
          'Arrange on plate and serve'
        ],
        prep_time: '15 mins',
        is_active: true,
        sort_order: 5,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        day: 2,
        title: 'Oatmeal Power Bowl',
        description: 'Hearty oatmeal with fruits and nuts',
        detailed_content: 'A fiber-rich breakfast that provides sustained energy for your morning workout.',
        image_url: 'https://cdn.strongin30.com/nutrition/oatmeal.jpg',
        video_url: null,
        category: 'breakfast',
        calories: 320,
        ingredients: ['½ cup rolled oats', '1 cup water or almond milk', '½ banana, sliced', '1 tablespoon peanut butter', '1 tablespoon chopped nuts (almonds, walnuts)', 'Pinch of cinnamon'],
        preparation_steps: [
          'Combine oats and liquid in a pot',
          'Bring to simmer and cook for 5-7 minutes',
          'Stir occasionally until creamy',
          'Transfer to bowl',
          'Top with banana slices, peanut butter, and nuts',
          'Sprinkle with cinnamon'
        ],
        prep_time: '10 mins',
        is_active: true,
        sort_order: 6,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        day: 7,
        title: 'Healthy Nigerian Jollof Rice',
        description: 'Brown rice jollof with grilled chicken breast',
        detailed_content: 'A healthier version of the classic Nigerian dish using brown rice and lean protein.',
        image_url: 'https://cdn.strongin30.com/nutrition/jollof.jpg',
        video_url: 'https://cdn.strongin30.com/nutrition/videos/jollof.mp4',
        category: 'lunch',
        calories: 450,
        ingredients: ['1 cup brown rice', '200g chicken breast', '2 medium tomatoes', '1 onion', '1 red bell pepper', '2 tablespoons tomato paste', '1 teaspoon thyme', '1 teaspoon curry powder', '1 tablespoon olive oil', 'Salt and pepper to taste'],
        preparation_steps: [
          'Cook brown rice according to package directions',
          'Season chicken breast with salt, pepper, and thyme',
          'Grill chicken for 6-8 minutes per side until cooked through',
          'Blend tomatoes, onion, and bell pepper',
          'Heat oil in pot, add blended mixture and tomato paste',
          'Cook for 10 minutes until thickened',
          'Add cooked rice to sauce and mix well',
          'Serve with sliced grilled chicken'
        ],
        prep_time: '30 mins',
        is_active: true,
        sort_order: 7,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        day: 14,
        title: 'Grilled Fish with Plantain',
        description: 'Grilled tilapia with boiled plantain and vegetables',
        detailed_content: 'Lean protein with complex carbs and vegetables for a balanced lunch.',
        image_url: 'https://cdn.strongin30.com/nutrition/grilled-fish.jpg',
        video_url: null,
        category: 'lunch',
        calories: 400,
        ingredients: ['1 medium tilapia fish', '1 ripe plantain', '2 cups mixed vegetables (carrots, green beans, bell peppers)', '1 lemon', '2 cloves garlic, minced', '1 tablespoon olive oil', 'Salt and pepper to taste'],
        preparation_steps: [
          'Clean and season fish with lemon, garlic, salt, and pepper',
          'Grill fish for 5-7 minutes per side',
          'Peel plantain and cut into chunks',
          'Boil plantain until tender (about 10 minutes)',
          'Steam or stir-fry vegetables with olive oil',
          'Serve fish with plantain and vegetables'
        ],
        prep_time: '25 mins',
        is_active: true,
        sort_order: 8,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        day: 21,
        title: 'Vegetable Stir-fry with Chicken',
        description: 'Quick and healthy stir-fry with lean protein',
        detailed_content: 'A light dinner option that is packed with protein and vegetables.',
        image_url: 'https://cdn.strongin30.com/nutrition/stirfry.jpg',
        video_url: null,
        category: 'dinner',
        calories: 380,
        ingredients: ['150g chicken breast, sliced', '2 cups mixed vegetables (broccoli, bell peppers, carrots)', '1 onion, sliced', '2 cloves garlic, minced', '1 tablespoon low-sodium soy sauce', '1 teaspoon ginger, grated', '1 tablespoon olive oil'],
        preparation_steps: [
          'Heat oil in a wok or large pan',
          'Add garlic and ginger, stir for 30 seconds',
          'Add chicken and cook until no longer pink',
          'Add vegetables and stir-fry for 5-7 minutes',
          'Add soy sauce and stir to combine',
          'Serve hot'
        ],
        prep_time: '20 mins',
        is_active: true,
        sort_order: 9,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        day: null,
        title: 'Fruit & Nut Yogurt',
        description: 'Greek yogurt with fruits and nuts',
        detailed_content: 'A protein-rich snack that helps with muscle recovery and keeps you full between meals.',
        image_url: 'https://cdn.strongin30.com/nutrition/yogurt-snack.jpg',
        video_url: null,
        category: 'snack',
        calories: 180,
        ingredients: ['1 cup plain Greek yogurt', '½ cup mixed berries (strawberries, blueberries)', '1 tablespoon chopped almonds', '1 teaspoon honey (optional)'],
        preparation_steps: [
          'Place yogurt in a bowl',
          'Top with mixed berries',
          'Sprinkle with chopped almonds',
          'Drizzle with honey if desired'
        ],
        prep_time: '5 mins',
        is_active: true,
        sort_order: 10,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        day: null,
        title: 'Boiled Egg Snack',
        description: 'Simple protein snack',
        detailed_content: 'Eggs are a complete protein source and perfect for a quick, filling snack.',
        image_url: 'https://cdn.strongin30.com/nutrition/egg-snack.jpg',
        video_url: null,
        category: 'snack',
        calories: 70,
        ingredients: ['1 large egg', 'Pinch of salt and pepper'],
        preparation_steps: [
          'Place egg in a pot and cover with water',
          'Bring to boil, then reduce heat',
          'Simmer for 8-10 minutes',
          'Cool in cold water, peel, and enjoy'
        ],
        prep_time: '12 mins',
        is_active: true,
        sort_order: 11,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        day: 1,
        title: 'Day 1: Focus on Hydration',
        description: 'Drink extra water today',
        detailed_content: 'Your first workout will increase hydration needs. Aim for 3 liters today to support muscle function and recovery.',
        image_url: null,
        video_url: null,
        category: 'tip',
        calories: null,
        ingredients: ['½ cup rolled oats', '1 cup water or almond milk', '½ banana, sliced'],
      preparation_steps: ['Combine oats and liquid in a pot', 'Bring to simmer...'],
        prep_time: null,
        is_active: true,
        sort_order: 12,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        day: 7,
        title: 'Day 7: Post-Workout Recovery',
        description: 'Eat protein within 30 minutes of workout',
        detailed_content: 'After your week 1 workout, consume 20-30g of protein to maximize muscle recovery and growth.',
        image_url: null,
        video_url: null,
        category: 'tip',
        calories: null,
         ingredients: ['½ cup rolled oats', '1 cup water or almond milk', '½ banana, sliced'],
      preparation_steps: ['Combine oats and liquid in a pot', 'Bring to simmer...'],
        prep_time: null,
        is_active: true,
        sort_order: 13,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        day: 15,
        title: 'Day 15: Mid-Program Energy Boost',
        description: 'Increase complex carbs',
        detailed_content: 'At the halfway point, your body needs more fuel. Add an extra serving of complex carbs (brown rice, sweet potato) to maintain energy levels.',
        image_url: null,
        video_url: null,
        category: 'tip',
        calories: null,
         ingredients: ['½ cup rolled oats', '1 cup water or almond milk', '½ banana, sliced'],
      preparation_steps: ['Combine oats and liquid in a pot', 'Bring to simmer...'],
        prep_time: null,
        is_active: true,
        sort_order: 14,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        day: 30,
        title: 'Day 30: Celebration Nutrition',
        description: 'Plan a healthy celebration meal',
        detailed_content: 'Congratulations on completing the program! Celebrate with a balanced meal that includes protein, complex carbs, and vegetables.',
        image_url: null,
        video_url: null,
        category: 'tip',
        calories: null,
        ingredients: ['½ cup rolled oats', '1 cup water or almond milk', '½ banana, sliced'],
      preparation_steps: ['Combine oats and liquid in a pot', 'Bring to simmer...'],
        prep_time: null,
        is_active: true,
        sort_order: 15,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('nutrition', nutritionItems);
    
    console.log(`✅ Seeded ${nutritionItems.length} nutrition items`);
    console.log('🥗 Nutrition Items Summary:');
    console.log(`   Tips: ${nutritionItems.filter(n => n.category === 'tip').length}`);
    console.log(`   Breakfasts: ${nutritionItems.filter(n => n.category === 'breakfast').length}`);
    console.log(`   Lunches: ${nutritionItems.filter(n => n.category === 'lunch').length}`);
    console.log(`   Dinners: ${nutritionItems.filter(n => n.category === 'dinner').length}`);
    console.log(`   Snacks: ${nutritionItems.filter(n => n.category === 'snack').length}`);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('nutrition', null, {});
    console.log('🗑️  All nutrition items deleted');
  }
};