'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create nutrition tips and meals
    const nutritionItems = [
      // ========== RECIPES (MAIN DISHES) ==========
      {
        id: uuidv4(),
        day: null,
        title: 'Healthy Jollof Rice',
        description: 'A healthier version of the beloved Nigerian classic, packed with vegetables and lean protein.',
        detailed_content: `
          <h3>About this Recipe</h3>
          <p>This healthy jollof rice uses brown rice for extra fiber and nutrients. Packed with lean protein and colorful vegetables, it's a complete meal that supports muscle recovery and provides sustained energy.</p>
          
          <h3>Nutrition Benefits</h3>
          <ul>
            <li>High in fiber for digestive health</li>
            <li>Rich in lean protein for muscle building</li>
            <li>Packed with antioxidants from vegetables</li>
            <li>Low in saturated fat</li>
          </ul>
        `,
        image_url: 'https://res.cloudinary.com/ndtech/image/upload/v1770383257/Gemini_Generated_Image_m1at0hm1at0hm1at_xnjfck.png',
        video_url: 'https://cdn.strongin30.com/nutrition/videos/healthy-jollof-rice.mp4',
        category: 'recipe',
        calories: 420,
        ingredients: [
          '2 cups brown rice (or white rice)',
          '1 can (400g) tomato puree',
          '1 large onion, blended',
          '3 bell peppers (red, yellow, green), diced',
          '2 fresh tomatoes, blended',
          '2 scotch bonnet peppers (optional, for heat)',
          '3 cloves garlic, minced',
          '1 tsp thyme',
          '1 tsp curry powder',
          '2 bay leaves',
          '1 cup mixed vegetables (carrots, peas, green beans)',
          '500g chicken breast or lean beef, cubed',
          '2 tbsp olive oil',
          'Salt and pepper to taste',
          '1 cup chicken or vegetable broth'
        ],
        preparation_steps: [
          'Rinse rice thoroughly and set aside.',
          'In a large pot, heat olive oil over medium heat.',
          'Add blended onions and sauté until translucent.',
          'Add blended tomatoes, peppers, tomato puree, garlic, thyme, and curry powder.',
          'Cook for 10-15 minutes until the sauce thickens and oil separates.',
          'Add chicken/beef and cook until browned on all sides.',
          'Add rice, mixed vegetables, and broth.',
          'Season with salt and pepper, stir well.',
          'Add bay leaves, reduce heat to low, cover and cook for 30-40 minutes.',
          'Fluff with fork, remove bay leaves, and serve hot.'
        ],
        prep_time: '55 mins',
        protein_g: 32,
        carbs_g: 68,
        fat_g: 9,
        fiber_g: 8,
        servings: 4,
        difficulty: 'intermediate',
        is_active: true,
        sort_order: 1,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        day: null,
        title: 'Fish Pepper Soup',
        description: 'A light, spicy soup perfect for recovery days. Low in calories, high in protein.',
        detailed_content: `
          <h3>About this Recipe</h3>
          <p>This traditional Nigerian soup is not only delicious but also packed with lean protein and anti-inflammatory spices. Perfect for post-workout recovery or when you need a light, nutritious meal.</p>
          
          <h3>Nutrition Benefits</h3>
          <ul>
            <li>High-quality protein for muscle repair</li>
            <li>Anti-inflammatory properties from spices</li>
            <li>Low in calories, perfect for weight management</li>
            <li>Rich in omega-3 fatty acids</li>
          </ul>
        `,
        image_url: 'https://res.cloudinary.com/ndtech/image/upload/v1770383720/Gemini_Generated_Image_ojyt6dojyt6dojyt_mnhu7i.png',
        video_url: 'https://cdn.strongin30.com/nutrition/videos/fish-pepper-soup.mp4',
        category: 'recipe',
        calories: 250,
        ingredients: [
          '1 kg fresh fish (tilapia or catfish), cleaned and cut',
          '1 large onion, sliced',
          '3-4 scotch bonnet peppers (adjust to taste)',
          '1 tbsp ground uziza seeds',
          '1 tbsp ground ehuru (calabash nutmeg)',
          '1 handful scent leaves (or basil)',
          '1 inch ginger, grated',
          '3 cloves garlic, minced',
          '1 stock cube',
          'Salt to taste',
          '1 liter water',
          '2 tbsp fresh lime juice'
        ],
        preparation_steps: [
          'Clean fish thoroughly and cut into serving pieces.',
          'In a pot, combine water, sliced onions, grated ginger, and minced garlic.',
          'Bring to a boil, then reduce heat to simmer for 5 minutes.',
          'Add scotch bonnet peppers, uziza seeds, ehuru, and stock cube.',
          'Add fish pieces and cook for 10-12 minutes until fish is cooked through.',
          'Add scent leaves and lime juice, cook for 2 more minutes.',
          'Season with salt to taste.',
          'Serve hot in bowls.'
        ],
        prep_time: '25 mins',
        protein_g: 35,
        carbs_g: 12,
        fat_g: 8,
        fiber_g: 3,
        servings: 4,
        difficulty: 'intermediate',
        is_active: true,
        sort_order: 2,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        day: null,
        title: 'Grilled Chicken Salad',
        description: 'A protein-packed salad with Nigerian flavors. Perfect for lunch.',
        detailed_content: `
          <h3>About this Recipe</h3>
          <p>This vibrant salad combines grilled chicken with fresh local vegetables and a light dressing. It\'s high in protein, low in carbs, and packed with vitamins and minerals.</p>
          
          <h3>Nutrition Benefits</h3>
          <ul>
            <li>High protein for muscle maintenance</li>
            <li>Low glycemic index vegetables</li>
            <li>Healthy fats from avocado and olive oil</li>
            <li>Rich in vitamins A, C, and K</li>
          </ul>
        `,
        image_url: 'https://res.cloudinary.com/ndtech/image/upload/v1770383259/Gemini_Generated_Image_f8ipyxf8ipyxf8ip_opdeue.png',
        video_url: 'https://cdn.strongin30.com/nutrition/videos/grilled-chicken-salad.mp4',
        category: 'recipe',
        calories: 380,
        ingredients: [
          '2 chicken breasts (about 200g each)',
          '4 cups mixed greens (lettuce, spinach, cabbage)',
          '1 medium cucumber, sliced',
          '2 ripe tomatoes, chopped',
          '1 red onion, thinly sliced',
          '1 ripe avocado, sliced',
          '1 bell pepper (any color), sliced',
          '2 tbsp olive oil',
          'Juice of 1 lemon',
          '1 tsp ginger, grated',
          '1 tsp garlic powder',
          'Salt and black pepper to taste',
          'Fresh herbs (parsley or cilantro) for garnish'
        ],
        preparation_steps: [
          'Season chicken breasts with garlic powder, grated ginger, salt, and pepper.',
          'Heat 1 tbsp olive oil in a grill pan over medium-high heat.',
          'Grill chicken for 6-8 minutes per side until cooked through.',
          'Let chicken rest for 5 minutes, then slice into strips.',
          'In a large bowl, combine mixed greens, cucumber, tomatoes, onion, avocado, and bell pepper.',
          'In a small bowl, whisk together remaining olive oil, lemon juice, salt, and pepper for dressing.',
          'Top salad with grilled chicken slices.',
          'Drizzle with dressing, garnish with fresh herbs, and serve immediately.'
        ],
        prep_time: '20 mins',
        protein_g: 38,
        carbs_g: 22,
        fat_g: 18,
        fiber_g: 7,
        servings: 2,
        difficulty: 'beginner',
        is_active: true,
        sort_order: 3,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        day: null,
        title: 'Oatmeal Power Bowl',
        description: 'Hearty oatmeal with fruits and nuts for sustained energy.',
        detailed_content: `
          <h3>About this Recipe</h3>
          <p>Start your day with this nutrient-dense oatmeal bowl. Packed with complex carbs, healthy fats, and protein, it provides steady energy for your morning workout.</p>
          
          <h3>Nutrition Benefits</h3>
          <ul>
            <li>High in soluble fiber for heart health</li>
            <li>Slow-releasing carbohydrates for sustained energy</li>
            <li>Healthy fats from nuts and seeds</li>
            <li>Natural sweetness from fruits</li>
          </ul>
        `,
        image_url: 'https://res.cloudinary.com/ndtech/image/upload/v1770383257/Gemini_Generated_Image_p1tdapp1tdapp1td_axekw2.png',
        video_url: null,
        category: 'breakfast',
        calories: 320,
        ingredients: [
          '½ cup rolled oats',
          '1 cup water or almond milk',
          '½ banana, sliced',
          '1 tbsp peanut butter',
          '1 tbsp chopped nuts (almonds, walnuts)',
          '1 tbsp chia seeds or flaxseeds',
          '1 tsp honey (optional)',
          'Pinch of cinnamon',
          'Fresh berries for topping'
        ],
        preparation_steps: [
          'Combine oats and liquid in a pot.',
          'Bring to a simmer and cook for 5-7 minutes, stirring occasionally.',
          'Remove from heat and let sit for 2 minutes.',
          'Transfer to a bowl and top with banana slices.',
          'Add peanut butter, chopped nuts, and seeds.',
          'Drizzle with honey if using, sprinkle with cinnamon.',
          'Top with fresh berries and serve warm.'
        ],
        prep_time: '10 mins',
        protein_g: 12,
        carbs_g: 52,
        fat_g: 11,
        fiber_g: 9,
        servings: 1,
        difficulty: 'beginner',
        is_active: true,
        sort_order: 4,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        day: null,
        title: 'Vegetable Stir-fry with Chicken',
        description: 'Quick and healthy stir-fry with lean protein and colorful vegetables.',
        detailed_content: `
          <h3>About this Recipe</h3>
          <p>A quick, one-pan meal that\'s packed with protein and vegetables. Perfect for busy days when you need a nutritious meal in minutes.</p>
          
          <h3>Nutrition Benefits</h3>
          <ul>
            <li>High in lean protein</li>
            <li>Rich in vitamins from colorful vegetables</li>
            <li>Low in saturated fat</li>
            <li>Quick and easy to prepare</li>
          </ul>
        `,
        image_url: 'https://res.cloudinary.com/ndtech/image/upload/v1770383257/Gemini_Generated_Image_m1at0hm1at0hm1at_xnjfck.png',
        video_url: null,
        category: 'dinner',
        calories: 380,
        ingredients: [
          '150g chicken breast, thinly sliced',
          '2 cups mixed vegetables (broccoli, bell peppers, carrots, snow peas)',
          '1 onion, sliced',
          '2 cloves garlic, minced',
          '1 tsp ginger, grated',
          '2 tbsp low-sodium soy sauce',
          '1 tbsp oyster sauce (optional)',
          '1 tbsp olive oil',
          '1 tsp sesame oil',
          'Green onions for garnish'
        ],
        preparation_steps: [
          'Heat olive oil in a wok or large pan over high heat.',
          'Add chicken and stir-fry until no longer pink, about 4-5 minutes.',
          'Remove chicken and set aside.',
          'In the same pan, add onion, garlic, and ginger. Stir-fry for 1 minute.',
          'Add vegetables and stir-fry for 5-7 minutes until crisp-tender.',
          'Return chicken to the pan.',
          'Add soy sauce and oyster sauce, stir to combine.',
          'Drizzle with sesame oil, garnish with green onions.',
          'Serve hot over brown rice or quinoa.'
        ],
        prep_time: '20 mins',
        protein_g: 35,
        carbs_g: 22,
        fat_g: 15,
        fiber_g: 6,
        servings: 2,
        difficulty: 'intermediate',
        is_active: true,
        sort_order: 5,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        day: null,
        title: 'Fruit & Nut Yogurt',
        description: 'Greek yogurt with fruits and nuts - perfect protein snack.',
        detailed_content: `
          <h3>About this Snack</h3>
          <p>This protein-packed snack is perfect for post-workout recovery or as a healthy dessert. Greek yogurt provides probiotics for gut health.</p>
        `,
        image_url: 'https://res.cloudinary.com/ndtech/image/upload/v1770383259/Gemini_Generated_Image_f8ipyxf8ipyxf8ip_opdeue.png',
        video_url: null,
        category: 'snack',
        calories: 180,
        ingredients: [
          '1 cup plain Greek yogurt',
          '½ cup mixed berries (strawberries, blueberries)',
          '1 tbsp chopped almonds',
          '1 tbsp chia seeds',
          '1 tsp honey',
          'Dash of vanilla extract'
        ],
        preparation_steps: [
          'Place Greek yogurt in a bowl.',
          'Top with mixed berries.',
          'Sprinkle with chopped almonds and chia seeds.',
          'Drizzle with honey and add vanilla extract.',
          'Stir gently and enjoy.'
        ],
        prep_time: '5 mins',
        protein_g: 20,
        carbs_g: 15,
        fat_g: 7,
        fiber_g: 4,
        servings: 1,
        difficulty: 'beginner',
        is_active: true,
        sort_order: 6,
        created_at: new Date(),
        updated_at: new Date()
      },

      // ========== NUTRITION TIPS ==========
      {
        id: uuidv4(),
        day: null,
        title: 'Stay Hydrated',
        description: 'Drink at least 2-3 liters of water daily',
        detailed_content: 'Proper hydration is essential for muscle function, recovery, and fat loss. Drink water throughout the day, especially before and after workouts. Add lemon or cucumber for flavor if needed.',
        image_url: 'https://res.cloudinary.com/ndtech/image/upload/v1770383257/Gemini_Generated_Image_p1tdapp1tdapp1td_axekw2.png',
        video_url: null,
        category: 'tip',
        calories: null,
        ingredients: null,
        preparation_steps: null,
        prep_time: null,
        protein_g: null,
        carbs_g: null,
        fat_g: null,
        fiber_g: null,
        servings: null,
        difficulty: null,
        is_active: true,
        sort_order: 7,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        day: null,
        title: 'Eat Protein with Every Meal',
        description: 'Include protein in every meal to support muscle recovery',
        detailed_content: 'Aim for 20-30g of protein per meal. Protein helps repair muscle tissue, keeps you full longer, and boosts metabolism. Good sources: chicken, fish, eggs, beans, lentils, Greek yogurt.',
        image_url: 'https://res.cloudinary.com/ndtech/image/upload/v1770383259/Gemini_Generated_Image_f8ipyxf8ipyxf8ip_opdeue.png',
        video_url: null,
        category: 'tip',
        calories: null,
        ingredients: null,
        preparation_steps: null,
        prep_time: null,
        protein_g: null,
        carbs_g: null,
        fat_g: null,
        fiber_g: null,
        servings: null,
        difficulty: null,
        is_active: true,
        sort_order: 8,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('nutrition', nutritionItems);
    
    console.log(`✅ Seeded ${nutritionItems.length} nutrition items`);
    console.log('🥗 Nutrition Items Summary:');
    console.log(`   Recipes: ${nutritionItems.filter(n => n.category === 'recipe').length}`);
    console.log(`   Breakfasts: ${nutritionItems.filter(n => n.category === 'breakfast').length}`);
    console.log(`   Lunches: ${nutritionItems.filter(n => n.category === 'lunch').length}`);
    console.log(`   Dinners: ${nutritionItems.filter(n => n.category === 'dinner').length}`);
    console.log(`   Snacks: ${nutritionItems.filter(n => n.category === 'snack').length}`);
    console.log(`   Tips: ${nutritionItems.filter(n => n.category === 'tip').length}`);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('nutrition', null, {});
    console.log('🗑️  All nutrition items deleted');
  }
};