import { useEffect, useMemo, useState } from 'react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import './MealPlanner.css'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MEAL_SLOTS = ['Breakfast', 'Morning Snack', 'Lunch', 'Evening Snack', 'Dinner']
const CATEGORY_OPTIONS = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snacks', 'South Indian', 'North Indian', 'Healthy', 'High Protein', 'Quick Meals', 'Vegetarian', 'Vegan']

const mealLibrary = {
  Breakfast: [
    {
      name: 'Berry Oat Protein Bowl',
      ingredients: ['oats', 'berries', 'Greek yogurt', 'chia seeds', 'almonds'],
      calories: 420,
      protein: 28,
      carbs: 46,
      fat: 12,
      vitamins: 'Vitamin C, B12, Iron',
      prepTime: 10,
      instructions: 'Cook oats with water or milk, top with berries, yogurt, chia and almonds, then serve warm.',
      dietary: ['Vegetarian'],
      goal: ['Weight Loss', 'Balanced Diet', 'Maintenance']
    },
    {
      name: 'Avocado Spinach Omelet',
      ingredients: ['eggs', 'spinach', 'avocado', 'tomato', 'olive oil'],
      calories: 390,
      protein: 26,
      carbs: 14,
      fat: 24,
      vitamins: 'Vitamin A, K, Folate',
      prepTime: 12,
      instructions: 'Sauté spinach, scramble eggs, fold in avocado and tomato, then cook until set.',
      dietary: ['Vegetarian'],
      goal: ['Weight Loss', 'Balanced Diet', 'Maintenance', 'Weight Gain']
    },
    {
      name: 'Chia Banana Smoothie',
      ingredients: ['banana', 'almond milk', 'chia seeds', 'peanut butter', 'oats'],
      calories: 460,
      protein: 18,
      carbs: 54,
      fat: 18,
      vitamins: 'Vitamin B6, Magnesium, Potassium',
      prepTime: 8,
      instructions: 'Blend all ingredients until smooth, pour into a glass and enjoy immediately.',
      dietary: ['Vegetarian', 'Vegan'],
      goal: ['Weight Gain', 'Maintenance', 'Balanced Diet']
    },
    {
      name: 'Peanut Butter Apple Toast',
      ingredients: ['whole grain bread', 'apple', 'peanut butter', 'cinnamon'],
      calories: 340,
      protein: 14,
      carbs: 42,
      fat: 14,
      vitamins: 'Vitamin C, Magnesium, Fiber',
      prepTime: 7,
      instructions: 'Toast bread, spread peanut butter, add thin apple slices and cinnamon.',
      dietary: ['Vegetarian', 'Vegan'],
      goal: ['Weight Gain', 'Maintenance', 'Balanced Diet']
    }
  ],
  'Morning Snack': [
    {
      name: 'Apple Cinnamon Yogurt',
      ingredients: ['apple', 'Greek yogurt', 'cinnamon', 'walnuts'],
      calories: 220,
      protein: 16,
      carbs: 22,
      fat: 8,
      vitamins: 'Vitamin C, Calcium',
      prepTime: 5,
      instructions: 'Dice the apple, spoon yogurt into a bowl, and top with cinnamon and chopped walnuts.',
      dietary: ['Vegetarian'],
      goal: ['Weight Loss', 'Balanced Diet', 'Maintenance']
    },
    {
      name: 'Hummus Veggie Cups',
      ingredients: ['hummus', 'carrot', 'cucumber', 'bell pepper', 'whole grain crackers'],
      calories: 260,
      protein: 10,
      carbs: 28,
      fat: 12,
      vitamins: 'Vitamin A, C, Fiber',
      prepTime: 7,
      instructions: 'Slice vegetables and serve with hummus and crackers for a fresh crunchy snack.',
      dietary: ['Vegetarian', 'Vegan'],
      goal: ['Balanced Diet', 'Maintenance', 'Weight Loss']
    },
    {
      name: 'Cottage Cheese Fruit Mix',
      ingredients: ['cottage cheese', 'pineapple', 'pumpkin seeds', 'berries'],
      calories: 310,
      protein: 21,
      carbs: 26,
      fat: 9,
      vitamins: 'Vitamin C, Calcium, Selenium',
      prepTime: 6,
      instructions: 'Combine cottage cheese with fruit and top with seeds for a filling snack.',
      dietary: ['Vegetarian'],
      goal: ['Weight Gain', 'Maintenance', 'Balanced Diet']
    },
    {
      name: 'Edamame Crunch Cup',
      ingredients: ['edamame', 'cucumber', 'sesame seeds', 'lemon'],
      calories: 230,
      protein: 17,
      carbs: 20,
      fat: 9,
      vitamins: 'Vitamin C, Folate, Iron',
      prepTime: 8,
      instructions: 'Steam edamame, toss with cucumber, sesame seeds, and lemon, then chill.',
      dietary: ['Vegetarian', 'Vegan'],
      goal: ['Weight Loss', 'Balanced Diet', 'Maintenance']
    }
  ],
  Lunch: [
    {
      name: 'Quinoa Chicken Power Bowl',
      ingredients: ['quinoa', 'chicken breast', 'spinach', 'tomato', 'avocado'],
      calories: 560,
      protein: 42,
      carbs: 42,
      fat: 19,
      vitamins: 'Vitamin A, C, Folate',
      prepTime: 20,
      instructions: 'Cook quinoa, season chicken, and layer with spinach, tomato, and avocado in a bowl.',
      dietary: ['Non-vegetarian'],
      goal: ['Weight Loss', 'Maintenance', 'Balanced Diet', 'Weight Gain']
    },
    {
      name: 'Chickpea Rainbow Salad',
      ingredients: ['chickpeas', 'quinoa', 'spinach', 'tomato', 'cucumber', 'lemon'],
      calories: 510,
      protein: 20,
      carbs: 58,
      fat: 16,
      vitamins: 'Vitamin C, Iron, Fiber',
      prepTime: 15,
      instructions: 'Toss chickpeas and quinoa with chopped greens and vegetables, then dress with lemon.',
      dietary: ['Vegetarian', 'Vegan'],
      goal: ['Weight Loss', 'Balanced Diet', 'Maintenance']
    },
    {
      name: 'Tofu Rice Veggie Bowl',
      ingredients: ['tofu', 'brown rice', 'broccoli', 'carrot', 'soy sauce'],
      calories: 610,
      protein: 31,
      carbs: 63,
      fat: 23,
      vitamins: 'Vitamin K, C, B6',
      prepTime: 18,
      instructions: 'Sear tofu, sauté vegetables, and serve over brown rice with soy sauce.',
      dietary: ['Vegetarian', 'Vegan'],
      goal: ['Weight Gain', 'Balanced Diet', 'Maintenance']
    },
    {
      name: 'Black Bean Fajita Bowl',
      ingredients: ['black beans', 'brown rice', 'bell pepper', 'corn', 'avocado'],
      calories: 590,
      protein: 24,
      carbs: 72,
      fat: 19,
      vitamins: 'Vitamin C, Folate, Fiber',
      prepTime: 18,
      instructions: 'Warm beans and rice, sauté peppers and corn, then assemble with avocado.',
      dietary: ['Vegetarian', 'Vegan'],
      goal: ['Weight Gain', 'Balanced Diet', 'Maintenance']
    }
  ],
  'Evening Snack': [
    {
      name: 'Cinnamon Banana Toast',
      ingredients: ['whole grain bread', 'banana', 'peanut butter', 'cinnamon'],
      calories: 300,
      protein: 12,
      carbs: 35,
      fat: 11,
      vitamins: 'Potassium, Magnesium',
      prepTime: 8,
      instructions: 'Toast bread, spread peanut butter, add banana slices and cinnamon.',
      dietary: ['Vegetarian', 'Vegan'],
      goal: ['Balanced Diet', 'Weight Gain', 'Maintenance']
    },
    {
      name: 'Trail Mix Crunch',
      ingredients: ['almonds', 'pumpkin seeds', 'dried cranberries', 'dark chocolate'],
      calories: 240,
      protein: 8,
      carbs: 24,
      fat: 13,
      vitamins: 'Magnesium, Iron',
      prepTime: 3,
      instructions: 'Combine the mix in a small bowl and enjoy as a quick energy snack.',
      dietary: ['Vegetarian', 'Vegan'],
      goal: ['Weight Gain', 'Maintenance', 'Balanced Diet']
    },
    {
      name: 'Cucumber Yogurt Dip',
      ingredients: ['Greek yogurt', 'cucumber', 'mint', 'whole grain crackers'],
      calories: 260,
      protein: 18,
      carbs: 20,
      fat: 9,
      vitamins: 'Calcium, Vitamin C',
      prepTime: 6,
      instructions: 'Mix yogurt with chopped cucumber and mint, then serve with crackers.',
      dietary: ['Vegetarian'],
      goal: ['Weight Loss', 'Balanced Diet', 'Maintenance']
    },
    {
      name: 'Roasted Chickpea Snack',
      ingredients: ['chickpeas', 'olive oil', 'paprika', 'lemon'],
      calories: 280,
      protein: 12,
      carbs: 34,
      fat: 10,
      vitamins: 'Iron, Folate, Fiber',
      prepTime: 25,
      instructions: 'Toss chickpeas with oil and paprika, roast until crisp, then finish with lemon.',
      dietary: ['Vegetarian', 'Vegan'],
      goal: ['Weight Loss', 'Balanced Diet', 'Maintenance']
    }
  ],
  Dinner: [
    {
      name: 'Salmon Sweet Potato Plate',
      ingredients: ['salmon', 'sweet potato', 'broccoli', 'olive oil', 'lemon'],
      calories: 640,
      protein: 38,
      carbs: 42,
      fat: 33,
      vitamins: 'Vitamin A, C, Omega-3',
      prepTime: 25,
      instructions: 'Roast the sweet potato and salmon, then serve with steamed broccoli and lemon.',
      dietary: ['Non-vegetarian'],
      goal: ['Weight Loss', 'Maintenance', 'Balanced Diet']
    },
    {
      name: 'Lentil Veggie Curry',
      ingredients: ['lentils', 'coconut milk', 'spinach', 'tomato', 'brown rice'],
      calories: 610,
      protein: 30,
      carbs: 64,
      fat: 22,
      vitamins: 'Vitamin A, Folate, Iron',
      prepTime: 28,
      instructions: 'Simmer lentils with coconut milk and vegetables until creamy, then serve with rice.',
      dietary: ['Vegetarian', 'Vegan'],
      goal: ['Balanced Diet', 'Weight Loss', 'Maintenance']
    },
    {
      name: 'Turkey Bean Stir-Fry',
      ingredients: ['turkey mince', 'black beans', 'bell pepper', 'brown rice', 'garlic'],
      calories: 700,
      protein: 44,
      carbs: 60,
      fat: 28,
      vitamins: 'Vitamin C, Iron, Potassium',
      prepTime: 22,
      instructions: 'Sauté turkey and vegetables, add beans and rice, then stir-fry until fully cooked.',
      dietary: ['Non-vegetarian'],
      goal: ['Weight Gain', 'Maintenance', 'Balanced Diet']
    },
    {
      name: 'Chicken Lentil Stew',
      ingredients: ['chicken breast', 'lentils', 'carrot', 'tomato', 'spinach'],
      calories: 670,
      protein: 46,
      carbs: 55,
      fat: 24,
      vitamins: 'Iron, Vitamin A, Folate',
      prepTime: 30,
      instructions: 'Brown chicken, simmer with lentils and carrot, then fold in tomato and spinach.',
      dietary: ['Non-vegetarian'],
      goal: ['Weight Gain', 'Maintenance', 'Balanced Diet', 'Weight Loss']
    }
  ]
}

// Add future recipes here; the planner automatically exposes them in filters and swaps.
const additionalRecipes = {
  Breakfast: [
    {
      name: 'Masala Paneer Scramble',
      description: 'A warm Indian-style scramble with paneer, tomato, onion, and fragrant spices.',
      ingredients: ['paneer', 'eggs', 'tomato', 'onion', 'turmeric'],
      ingredientQuantities: ['100 g', '2 large', '1 medium', '1/2 medium', '1/4 tsp'],
      calories: 410, protein: 29, carbs: 16, fat: 25, vitamins: 'Calcium, Vitamin A, B12', prepTime: 10, cookingTime: 12,
      instructions: 'Cook onion and tomato with spices, crumble in paneer, add eggs, and scramble until set.',
      steps: ['Dice the onion and tomato, then crumble the paneer.', 'Saute onion and tomato with turmeric until soft.', 'Add paneer and eggs, then stir gently until the eggs are set.', 'Serve hot with whole grain toast.'],
      dietary: ['Vegetarian'], goal: ['Balanced Diet', 'Maintenance', 'Weight Gain'], categories: ['Breakfast', 'High Protein'],
      image: '/images/recipes/masala-paneer-scramble.jpg', source: 'Local recipe image'
    },
    {
      name: 'Overnight Mango Chia Oats',
      description: 'Creamy make-ahead oats layered with mango, chia seeds, and yogurt.',
      ingredients: ['rolled oats', 'chia seeds', 'mango', 'Greek yogurt', 'milk'],
      ingredientQuantities: ['1/2 cup', '1 tbsp', '1/2 cup diced', '1/3 cup', '1/2 cup'],
      calories: 360, protein: 20, carbs: 55, fat: 9, vitamins: 'Vitamin C, Calcium, Fiber', prepTime: 5, cookingTime: 0,
      instructions: 'Mix oats, chia, milk, and yogurt, chill overnight, and finish with mango.',
      steps: ['Combine oats, chia seeds, milk, and yogurt in a jar.', 'Stir well, cover, and refrigerate for at least 4 hours.', 'Top with diced mango before serving.', 'Enjoy chilled or warm gently.'],
      dietary: ['Vegetarian'], goal: ['Weight Loss', 'Balanced Diet', 'Maintenance'], categories: ['Breakfast', 'Healthy', 'Quick Meals'],
      image: '/images/recipes/overnight-mango-chia-oats.jpg', source: 'Local recipe image'
    }
  ],
  'Morning Snack': [
    {
      name: 'Roasted Makhana Chaat',
      description: 'Crunchy roasted fox nuts tossed with vegetables, lemon, and chaat spices.',
      ingredients: ['makhana', 'tomato', 'onion', 'lemon juice', 'chaat masala'],
      ingredientQuantities: ['2 cups', '1 small', '1/2 small', '1 tbsp', '1/2 tsp'],
      calories: 210, protein: 8, carbs: 32, fat: 7, vitamins: 'Calcium, Magnesium, Fiber', prepTime: 8, cookingTime: 8,
      instructions: 'Dry roast makhana until crisp, cool, and toss with chopped vegetables and spices.',
      steps: ['Dry roast makhana in a pan until crisp.', 'Chop tomato and onion finely.', 'Cool the makhana for two minutes.', 'Toss with vegetables, lemon juice, and chaat masala.'],
      dietary: ['Vegetarian', 'Vegan'], goal: ['Weight Loss', 'Balanced Diet', 'Maintenance'], categories: ['Snacks', 'Healthy', 'North Indian'],
      image: '/images/recipes/roasted-makhana-chaat.jpg', source: 'Local recipe image'
    },
    {
      name: 'Peanut Sundal',
      description: 'South Indian spiced peanuts with coconut, curry leaves, and mustard seeds.',
      ingredients: ['boiled peanuts', 'fresh coconut', 'mustard seeds', 'curry leaves', 'lemon'],
      ingredientQuantities: ['1 cup', '2 tbsp grated', '1/2 tsp', '8 leaves', '1/2 medium'],
      calories: 280, protein: 13, carbs: 20, fat: 17, vitamins: 'Magnesium, Folate, Vitamin E', prepTime: 5, cookingTime: 7,
      instructions: 'Temper mustard seeds and curry leaves, toss in peanuts and coconut, then finish with lemon.',
      steps: ['Heat oil and crackle mustard seeds.', 'Add curry leaves and stir for 20 seconds.', 'Toss in boiled peanuts and coconut.', 'Season with lemon and serve warm.'],
      dietary: ['Vegetarian', 'Vegan'], goal: ['Weight Gain', 'Balanced Diet', 'Maintenance'], categories: ['Snacks', 'South Indian', 'High Protein'],
      image: '/images/recipes/peanut-sundal.jpg', source: 'Local recipe image'
    }
  ],
  Lunch: [
    {
      name: 'Paneer Butter Masala',
      description: 'Tender paneer in a silky tomato and cashew gravy with warming Indian spices.',
      ingredients: ['paneer', 'tomato puree', 'cashews', 'butter', 'cream', 'garam masala'],
      ingredientQuantities: ['150 g cubes', '1 cup', '10', '1 tbsp', '2 tbsp', '1 tsp'],
      calories: 580, protein: 25, carbs: 26, fat: 41, vitamins: 'Calcium, Vitamin A, Lycopene', prepTime: 15, cookingTime: 25,
      instructions: 'Blend a tomato-cashew base, simmer with spices, and fold in paneer and cream.',
      steps: ['Soak cashews and blend them with tomato puree.', 'Cook the puree with butter and spices until glossy.', 'Add a splash of water and simmer for 10 minutes.', 'Fold in paneer and cream, then serve with rice or roti.'],
      dietary: ['Vegetarian'], goal: ['Balanced Diet', 'Maintenance', 'Weight Gain'], categories: ['Lunch', 'North Indian', 'Vegetarian'],
      image: '/images/recipes/paneer-butter-masala.jpg', source: 'Local recipe image'
    },
    {
      name: 'South Indian Lemon Rice',
      description: 'Bright, nutty lemon rice with peanuts, curry leaves, and turmeric.',
      ingredients: ['cooked rice', 'lemon juice', 'peanuts', 'curry leaves', 'turmeric', 'green chilli'],
      ingredientQuantities: ['2 cups', '2 tbsp', '2 tbsp', '10 leaves', '1/4 tsp', '1 sliced'],
      calories: 430, protein: 10, carbs: 68, fat: 14, vitamins: 'Vitamin C, Iron, Fiber', prepTime: 10, cookingTime: 8,
      instructions: 'Temper spices and peanuts, fold in cooked rice, and finish with fresh lemon juice.',
      steps: ['Warm oil and toast peanuts until golden.', 'Add curry leaves, chilli, and turmeric.', 'Fold in cooked rice and toss gently.', 'Turn off the heat, add lemon juice, and serve.'],
      dietary: ['Vegetarian', 'Vegan'], goal: ['Balanced Diet', 'Maintenance', 'Weight Gain'], categories: ['Lunch', 'South Indian', 'Quick Meals'],
      image: '/images/recipes/south-indian-lemon-rice.jpg', source: 'Local recipe image'
    }
  ],
  Dinner: [
    {
      name: 'Tandoori Chicken Plate',
      description: 'Yogurt-marinated chicken roasted with tandoori spices and served with fresh salad.',
      ingredients: ['chicken thighs', 'Greek yogurt', 'lemon', 'tandoori masala', 'cucumber'],
      ingredientQuantities: ['200 g', '1/3 cup', '1 tbsp', '1 tbsp', '1/2 medium'],
      calories: 520, protein: 48, carbs: 18, fat: 27, vitamins: 'Vitamin B6, B12, Zinc', prepTime: 20, cookingTime: 30,
      instructions: 'Marinate chicken in spiced yogurt, roast until cooked through, and serve with salad.',
      steps: ['Mix yogurt, lemon, and tandoori masala.', 'Coat the chicken and marinate for at least 30 minutes.', 'Roast at 220°C until browned and cooked through.', 'Rest for five minutes, slice, and serve with cucumber salad.'],
      dietary: ['Non-vegetarian'], goal: ['Weight Loss', 'Maintenance', 'Balanced Diet', 'Weight Gain'], categories: ['Dinner', 'North Indian', 'High Protein'],
      image: '/images/recipes/tandoori-chicken-plate.jpg', source: 'Local recipe image'
    },
    {
      name: 'Palak Tofu Curry',
      description: 'Silky spinach curry with golden tofu, ginger, garlic, and cumin.',
      ingredients: ['firm tofu', 'spinach', 'onion', 'tomato', 'ginger garlic paste'],
      ingredientQuantities: ['180 g', '3 cups', '1 medium', '1 medium', '1 tbsp'],
      calories: 390, protein: 28, carbs: 24, fat: 20, vitamins: 'Iron, Vitamin K, Folate', prepTime: 15, cookingTime: 20,
      instructions: 'Blanch spinach, blend it smooth, then simmer with aromatics and seared tofu.',
      steps: ['Blanch spinach for one minute and blend until smooth.', 'Sear tofu cubes until lightly golden.', 'Cook onion, tomato, and ginger garlic paste.', 'Add spinach puree and tofu, then simmer for five minutes.'],
      dietary: ['Vegetarian', 'Vegan'], goal: ['Weight Loss', 'Balanced Diet', 'Maintenance'], categories: ['Dinner', 'Healthy', 'High Protein'],
      image: '/images/recipes/palak-tofu-curry.jpg', source: 'Local recipe image'
    },
    {
      name: 'Idli Sambar Plate',
      description: 'Soft steamed idlis paired with lentil-rich sambar and fresh coconut chutney.',
      ingredients: ['idli batter', 'toor dal', 'mixed vegetables', 'tamarind', 'coconut chutney'],
      ingredientQuantities: ['1 cup', '1/2 cup', '1 cup chopped', '1 tbsp', '1/4 cup'],
      calories: 440, protein: 17, carbs: 70, fat: 10, vitamins: 'Iron, Folate, Calcium', prepTime: 15, cookingTime: 25,
      instructions: 'Steam idlis and serve them with a vegetable sambar and coconut chutney.',
      steps: ['Soak and pressure-cook toor dal until soft.', 'Simmer vegetables with tamarind and sambar spices.', 'Steam idli batter in greased moulds for 10 to 12 minutes.', 'Serve hot idlis with sambar and chutney.'],
      dietary: ['Vegetarian', 'Vegan'], goal: ['Balanced Diet', 'Maintenance', 'Weight Loss'], categories: ['Dinner', 'South Indian', 'Healthy'],
      image: '/images/recipes/idli-sambar-plate.jpg', source: 'Local recipe image'
    },
    {
      name: 'Rajma Masala Rice',
      description: 'Slow-simmered kidney beans in tomato masala served with fragrant rice.',
      ingredients: ['kidney beans', 'basmati rice', 'tomato', 'onion', 'ginger garlic paste'],
      ingredientQuantities: ['1 cup cooked', '1 cup cooked', '2 medium', '1 medium', '1 tbsp'],
      calories: 560, protein: 21, carbs: 86, fat: 14, vitamins: 'Iron, Potassium, Folate', prepTime: 15, cookingTime: 35,
      instructions: 'Build a spiced tomato masala, simmer kidney beans, and serve with rice.',
      steps: ['Cook onion, tomato, and ginger garlic paste until soft.', 'Add spices and cooked kidney beans.', 'Simmer with water for 20 minutes until thick.', 'Serve with steamed basmati rice.'],
      dietary: ['Vegetarian', 'Vegan'], goal: ['Balanced Diet', 'Maintenance', 'Weight Gain'], categories: ['Dinner', 'North Indian', 'High Protein'],
      image: '/images/recipes/rajma-masala-rice.jpg', source: 'Local recipe image'
    }
  ]
}

Object.entries(additionalRecipes).forEach(([slot, recipes]) => {
  mealLibrary[slot].push(...recipes)
})

const defaultProfile = {
  age: 29,
  dietary: 'Vegetarian',
  goal: 'Balanced Diet',
  calories: 2200,
  pantry: ['oats', 'berries', 'Greek yogurt', 'spinach', 'eggs', 'quinoa', 'tomato', 'broccoli', 'brown rice', 'lentils', 'banana', 'cinnamon', 'almond milk']
}

const STORAGE_KEY = 'nutrimatrix-saved-meals'

const recipeImages = {
  'Berry Oat Protein Bowl': '/images/recipes/berry-oat-protein-bowl.jpg',
  'Avocado Spinach Omelet': '/images/recipes/avocado-spinach-omelet.jpg',
  'Chia Banana Smoothie': '/images/recipes/chia-banana-smoothie.jpg',
  'Peanut Butter Apple Toast': '/images/recipes/peanut-butter-apple-toast.jpg',
  'Apple Cinnamon Yogurt': '/images/recipes/apple-cinnamon-yogurt.jpg',
  'Hummus Veggie Cups': '/images/recipes/hummus-veggie-cups.jpg',
  'Cottage Cheese Fruit Mix': '/images/recipes/cottage-cheese-fruit-mix.jpg',
  'Edamame Crunch Cup': '/images/recipes/edamame-crunch-cup.jpg',
  'Quinoa Chicken Power Bowl': '/images/recipes/quinoa-chicken-power-bowl.jpg',
  'Chickpea Rainbow Salad': '/images/recipes/chickpea-rainbow-salad.jpg',
  'Tofu Rice Veggie Bowl': '/images/recipes/tofu-rice-veggie-bowl.jpg',
  'Black Bean Fajita Bowl': '/images/recipes/black-bean-fajita-bowl.jpg',
  'Cinnamon Banana Toast': '/images/recipes/cinnamon-banana-toast.jpg',
  'Trail Mix Crunch': '/images/recipes/trail-mix-crunch.jpg',
  'Cucumber Yogurt Dip': '/images/recipes/cucumber-yogurt-dip.jpg',
  'Roasted Chickpea Snack': '/images/recipes/roasted-chickpea-snack.jpg',
  'Salmon Sweet Potato Plate': '/images/recipes/salmon-sweet-potato-plate.jpg',
  'Lentil Veggie Curry': '/images/recipes/lentil-veggie-curry.jpg',
  'Turkey Bean Stir-Fry': '/images/recipes/turkey-bean-stir-fry.jpg',
  'Chicken Lentil Stew': '/images/recipes/chicken-lentil-stew.jpg'
}

const DEFAULT_RECIPE_IMAGE = '/images/recipes/default-food.jpg'

Object.values(mealLibrary).flat().forEach((recipe) => {
  recipe.image = recipe.image || recipeImages[recipe.name] || DEFAULT_RECIPE_IMAGE
})

const recipeSteps = {
  'Berry Oat Protein Bowl': ['Cook oats with milk or water until creamy.', 'Fold in chia seeds and Greek yogurt.', 'Top with berries and almonds, then serve warm.'],
  'Avocado Spinach Omelet': ['Whisk the eggs with a pinch of seasoning.', 'Sauté spinach and tomato in olive oil.', 'Pour in the eggs, fold with avocado, and cook until set.'],
  'Chia Banana Smoothie': ['Add banana, almond milk, chia, peanut butter, and oats to a blender.', 'Blend until smooth and creamy.', 'Pour into a glass and serve immediately.'],
  'Apple Cinnamon Yogurt': ['Dice the apple into bite-sized pieces.', 'Spoon Greek yogurt into a bowl.', 'Add apple, cinnamon, and walnuts before serving.'],
  'Hummus Veggie Cups': ['Wash and slice the carrot, cucumber, and bell pepper.', 'Spoon hummus into small serving cups.', 'Arrange the vegetables and crackers around the hummus.'],
  'Cottage Cheese Fruit Mix': ['Spoon cottage cheese into a bowl.', 'Add pineapple and berries.', 'Finish with pumpkin seeds and serve chilled.'],
  'Quinoa Chicken Power Bowl': ['Cook quinoa according to the package directions.', 'Season and cook the chicken until it reaches 165°F internally.', 'Layer quinoa, spinach, tomato, chicken, and avocado in a bowl.'],
  'Chickpea Rainbow Salad': ['Rinse the chickpeas and cook or warm the quinoa.', 'Chop the spinach, tomato, and cucumber.', 'Toss everything with lemon juice and serve.'],
  'Tofu Rice Veggie Bowl': ['Cook the brown rice and press the tofu dry.', 'Sear tofu until golden on both sides.', 'Sauté broccoli and carrot, then serve everything with soy sauce.'],
  'Cinnamon Banana Toast': ['Toast the whole grain bread until crisp.', 'Spread peanut butter over the toast.', 'Add banana slices and cinnamon.'],
  'Trail Mix Crunch': ['Measure almonds, pumpkin seeds, cranberries, and chocolate.', 'Combine everything in a bowl.', 'Portion into a small serving and store the rest airtight.'],
  'Cucumber Yogurt Dip': ['Dice the cucumber and chop the mint.', 'Stir cucumber and mint into Greek yogurt.', 'Serve with whole grain crackers.'],
  'Salmon Sweet Potato Plate': ['Roast the sweet potato until tender.', 'Season and bake the salmon until it flakes easily.', 'Steam broccoli and finish the plate with lemon.'],
  'Lentil Veggie Curry': ['Sauté tomato and spinach with the lentils.', 'Add coconut milk and simmer until creamy and tender.', 'Serve the curry over warm brown rice.'],
  'Turkey Bean Stir-Fry': ['Brown the turkey mince with garlic.', 'Add bell pepper and cook until tender.', 'Stir in black beans and brown rice, then heat through.'],
  'Peanut Butter Apple Toast': ['Toast the whole grain bread until crisp.', 'Spread peanut butter over the toast.', 'Add apple slices and cinnamon.'],
  'Edamame Crunch Cup': ['Steam the edamame until tender.', 'Slice the cucumber and combine it with the edamame.', 'Finish with sesame seeds and lemon.'],
  'Black Bean Fajita Bowl': ['Warm the black beans and brown rice.', 'Sauté bell pepper and corn until tender.', 'Assemble the bowl and top with avocado.'],
  'Roasted Chickpea Snack': ['Toss chickpeas with olive oil and paprika.', 'Roast until crisp and golden.', 'Finish with lemon and cool before serving.'],
  'Chicken Lentil Stew': ['Brown the chicken breast in a pot.', 'Add lentils and carrot, then simmer until tender.', 'Stir in tomato and spinach before serving.']
}

function enrichMeal(meal, slot) {
  return {
    ...meal,
    slot,
    image: meal.image || DEFAULT_RECIPE_IMAGE,
    steps: meal.steps || recipeSteps[meal.name] || [meal.instructions],
    description: meal.description || 'Fresh and nutritionally balanced meal suggestion.',
    categories: meal.categories || [slot === 'Morning Snack' || slot === 'Evening Snack' ? 'Snacks' : slot, ...(meal.dietary || [])],
    ingredientQuantities: meal.ingredientQuantities || meal.ingredients.map(() => '1 serving'),
    source: meal.source || 'Local recipe image',
    sourceLink: meal.sourceLink || meal.image || DEFAULT_RECIPE_IMAGE,
    servingSize: meal.servingSize || '1 serving',
    quantity: meal.quantity || '1 plate',
    cookingTime: meal.cookingTime || (meal.prepTime ? meal.prepTime + 10 : 20),
  }
}

function handleRecipeImageError(event) {
  if (event.currentTarget.src.endsWith(DEFAULT_RECIPE_IMAGE)) return
  event.currentTarget.src = DEFAULT_RECIPE_IMAGE
}

function normalizeDietary(preference) {
  if (preference === 'Vegan') return ['Vegan', 'Vegetarian']
  if (preference === 'Vegetarian') return ['Vegetarian']
  return ['Non-vegetarian', 'Vegetarian']
}

function getFoodOptions(slot, profile, category = 'All') {
  return mealLibrary[slot].filter((recipe) => {
    const allowedDiets = normalizeDietary(profile.dietary)
    const matchesDiet = recipe.dietary.some((diet) => allowedDiets.includes(diet))
    const matchesGoal = recipe.goal.includes(profile.goal)
    const categories = recipe.categories || [slot === 'Morning Snack' || slot === 'Evening Snack' ? 'Snacks' : slot, ...(recipe.dietary || [])]
    const matchesCategory = category === 'All' || categories.includes(category)
    return matchesDiet && matchesGoal && matchesCategory
  })
}

function rotateMeal(slot, profile, currentMeal) {
  const options = getFoodOptions(slot, profile)
  const currentIndex = options.findIndex((recipe) => recipe.name === currentMeal.name)
  const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % options.length : 0
  return { ...options[nextIndex], slot }
}

function buildMealPlan(profile) {
  return DAYS.map((day) => ({
    day,
    meals: MEAL_SLOTS.reduce((result, slot) => {
      const options = getFoodOptions(slot, profile)
      const preferredMeal = options[0] ?? mealLibrary[slot][0]
      result[slot] = enrichMeal(preferredMeal, slot)
      return result
    }, {})
  }))
}

function MealPlanner() {
  const [profile, setProfile] = useState(defaultProfile)
  const [plan, setPlan] = useState(() => buildMealPlan(defaultProfile))
  const [selectedDay, setSelectedDay] = useState('Sun')
  const [selectedMealSlot, setSelectedMealSlot] = useState('Breakfast')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedMeal, setSelectedMeal] = useState(() => buildMealPlan(defaultProfile)[0].meals.Breakfast)
  const [selectedRecipe, setSelectedRecipe] = useState(null)
  const [detailMode, setDetailMode] = useState('recipe')
  const [swapOptions, setSwapOptions] = useState([])
  const [recipeModalOpen, setRecipeModalOpen] = useState(false)
  const [swapModalOpen, setSwapModalOpen] = useState(false)
  const [groceryList, setGroceryList] = useState([])
  const [savedMeals, setSavedMeals] = useState([])
  const [statusMessage, setStatusMessage] = useState('')
  const [wizardOpen, setWizardOpen] = useState(false)
  const [recommendations, setRecommendations] = useState([
    'Lean protein and fiber-rich breakfasts for steady energy.',
    'Increase hydration and include greens in lunch bowls.',
    'Use pantry ingredients first to reduce waste and improve affordability.'
  ])

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return

    try {
      const parsed = JSON.parse(saved)
      setSavedMeals(Array.isArray(parsed) ? parsed : [])
    } catch (error) {
      setSavedMeals([])
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedMeals))
  }, [savedMeals])

  useEffect(() => {
    if (!statusMessage) return undefined

    const timer = window.setTimeout(() => setStatusMessage(''), 2200)
    return () => window.clearTimeout(timer)
  }, [statusMessage])

  const totals = useMemo(() => {
    const summary = { calories: 0, protein: 0, carbs: 0, fat: 0 }

    plan.forEach((day) => {
      Object.values(day.meals).forEach((meal) => {
        summary.calories += meal.calories
        summary.protein += meal.protein
        summary.carbs += meal.carbs
        summary.fat += meal.fat
      })
    })

    return summary
  }, [plan])

  const handleGeneratePlan = () => {
    const nextPlan = buildMealPlan(profile)
    setPlan(nextPlan)
    setSelectedDay('Sun')
    setSelectedMealSlot('Breakfast')
    setSelectedMeal(nextPlan[0].meals.Breakfast)
    setSelectedRecipe(nextPlan[0].meals.Breakfast)
    setRecipeModalOpen(false)
    setSwapModalOpen(false)
    setWizardOpen(true)
    setRecommendations([
      `Targeting ${profile.goal.toLowerCase()} for a ${profile.calories}-calorie routine.`,
      `Using ${profile.dietary.toLowerCase()} preferences with pantry-based ingredients.`,
      'Nutrition balance is optimized across breakfast, lunch, and dinner.'
    ])
  }

  const handleDayChange = (day) => {
    const meal = plan.find((dayPlan) => dayPlan.day === day)?.meals[selectedMealSlot]
    setSelectedDay(day)
    if (meal) {
      setSelectedMeal(meal)
      setSelectedRecipe(meal)
    }
  }

  const handleSlotChange = (slot) => {
    const meal = plan.find((dayPlan) => dayPlan.day === selectedDay)?.meals[slot]
    setSelectedMealSlot(slot)
    if (meal) {
      setSelectedMeal(meal)
      setSelectedRecipe(meal)
    }
  }

  const handleGetRecommendations = () => {
    const nextRecommendations = [
      `Prioritize ${profile.goal.toLowerCase()} meals with higher protein and fiber.`,
      `Use pantry ingredients such as ${profile.pantry.slice(0, 4).join(', ')} first.`,
      'Swap heavy dinner choices for lighter alternatives on busy days.'
    ]
    setRecommendations(nextRecommendations)
  }

  const handleSelectMealOption = (food) => {
    const updatedMeal = enrichMeal(food, selectedMealSlot)

    setPlan((currentPlan) => currentPlan.map((day) => {
      if (day.day !== selectedDay) return day

      return {
        ...day,
        meals: {
          ...day.meals,
          [selectedMealSlot]: updatedMeal
        }
      }
    }))

    setSelectedMeal(updatedMeal)
    setSelectedRecipe(updatedMeal)
    setDetailMode('recipe')
    setRecipeModalOpen(false)
    setSwapModalOpen(false)
    setStatusMessage('Meal selected successfully!')
    const key = getMealKey(selectedDay, selectedMealSlot, updatedMeal.name)
    setSavedMeals((current) => (current.includes(key) ? current : [...current, key]))
    setGroceryList((current) => [...new Set([...current, ...updatedMeal.ingredients])])
  }

  const getMealKey = (day, slot, mealName) => `${day}-${slot}-${mealName}`

  const handleViewRecipe = (day, slot, meal, event) => {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }

    const recipeDetail = enrichMeal(meal, slot)

    setSelectedDay(day)
    setSelectedMealSlot(slot)
    setSelectedMeal(recipeDetail)
    setSelectedRecipe(recipeDetail)
    setDetailMode('recipe')
    setRecipeModalOpen(true)
    setSwapModalOpen(false)
    setSwapOptions(getFoodOptions(slot, profile, selectedCategory)
      .filter((recipe) => recipe.name !== meal.name)
      .map((recipe) => enrichMeal(recipe, slot)))
  }

  const handleSwapMeal = (day, slot, currentMeal, event) => {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }

    const options = getFoodOptions(slot, profile, selectedCategory)
      .filter((recipe) => recipe.name !== currentMeal.name)
      .map((recipe) => enrichMeal(recipe, slot))
    const recipeDetail = enrichMeal(currentMeal, slot)

    setSelectedDay(day)
    setSelectedMealSlot(slot)
    setSelectedMeal(recipeDetail)
    setSelectedRecipe(recipeDetail)
    setDetailMode('swap')
    setSwapOptions(options)
    setRecipeModalOpen(true)
    setSwapModalOpen(true)
  }

  const handleAddToGroceryList = (meal) => {
    const nextItems = [...new Set([...groceryList, ...meal.ingredients])]
    setGroceryList(nextItems)
  }

  const handleSaveMeal = (day, slot) => {
    const key = getMealKey(day, slot, selectedRecipe?.name || selectedMeal?.name || 'meal')
    setSavedMeals((current) => current.includes(key) ? current : [...current, key])
    setStatusMessage('Recipe saved successfully ✓')
  }

  const handleChooseAlternative = (option) => {
    const updatedMeal = enrichMeal(option, selectedMealSlot)

    setPlan((currentPlan) => currentPlan.map((day) => {
      if (day.day !== selectedDay) return day

      return {
        ...day,
        meals: {
          ...day.meals,
          [selectedMealSlot]: updatedMeal
        }
      }
    }))

    setSelectedMeal(updatedMeal)
    setSelectedRecipe(updatedMeal)
    setDetailMode('recipe')
    setSwapOptions([])
    setSwapModalOpen(false)
    setRecipeModalOpen(true)
    setSavedMeals((current) => {
      const key = getMealKey(selectedDay, selectedMealSlot, updatedMeal.name)
      return current.includes(key) ? current : [...current, key]
    })
    setStatusMessage('Meal swapped successfully ✓')
  }

  const handleCloseRecipe = () => {
    setRecipeModalOpen(false)
    setSwapModalOpen(false)
    setSelectedRecipe(null)
  }

  const foodOptions = getFoodOptions(selectedMealSlot, profile, selectedCategory)
  const isCurrentMealSaved = selectedRecipe
    ? savedMeals.includes(getMealKey(selectedDay, selectedMealSlot, selectedRecipe.name))
    : false

  return (
    <div className="meal-planner-page">
      <Navbar />

      <main className="meal-planner-shell">
        <section className="planner-header">
          <div>
            <span className="planner-badge">🍽️ Smart Meal Planner</span>
            <h1>AI-powered weekly nutrition plan</h1>
          </div>

          <div className="planner-actions">
            <button type="button" className="btn-primary" onClick={handleGeneratePlan}>Generate Meal Plan</button>
            <button type="button" className="btn-secondary" onClick={handleGetRecommendations}>Get Recommendations</button>
          </div>
        </section>

        {wizardOpen && (
          <section className="meal-wizard">
            <div className="wizard-header">
              <div>
                <span className="planner-badge">📅 Weekly Setup</span>
                <h2>Set meals from Sun to Sat</h2>
              </div>
              <button type="button" className="btn-secondary" onClick={() => setWizardOpen(false)}>Close</button>
            </div>

            <div className="day-picker">
              {DAYS.map((day) => (
                <button
                  key={day}
                  className={selectedDay === day ? 'day-picker-button active' : 'day-picker-button'}
                  onClick={() => handleDayChange(day)}
                >
                  {day}
                </button>
              ))}
            </div>

            <div className="slot-tabs">
              {MEAL_SLOTS.map((slot) => (
                <button
                  key={slot}
                  className={selectedMealSlot === slot ? 'slot-tab active' : 'slot-tab'}
                  onClick={() => handleSlotChange(slot)}
                >
                  {slot}
                </button>
              ))}
            </div>

            <div className="food-picker-block">
              <div className="food-picker-header">
                <h3>{selectedDay} - {selectedMealSlot}</h3>
                <span>{foodOptions.length} {selectedCategory === 'All' ? 'food options' : `${selectedCategory} options`}</span>
              </div>

              <div className="food-picker-grid">
                {foodOptions.map((food) => (
                  <button
                    key={food.name}
                    className={selectedMeal?.name === food.name ? 'food-item active' : 'food-item'}
                    onClick={() => handleSelectMealOption(food)}
                  >
                    <img src={enrichMeal(food, selectedMealSlot).image} alt="" onError={handleRecipeImageError} />
                    <strong>{food.name}</strong>
                    <span>{food.calories} kcal</span>
                    <small>{food.protein}g protein</small>
                  </button>
                ))}
                {!foodOptions.length && <p className="empty-options">No recipes match this category and profile. Try another category or update your profile.</p>}
              </div>
            </div>
          </section>
        )}

        <section className="planner-layout">
          <aside className="planner-sidebar">
            <div className="profile-card">
              <h3>Profile Snapshot</h3>
              <div className="profile-grid">
                <label>
                  <span>Age</span>
                  <input
                    type="number"
                    value={profile.age}
                    onChange={(event) => setProfile((current) => ({ ...current, age: Number(event.target.value) || 0 }))}
                  />
                </label>

                <label>
                  <span>Diet</span>
                  <select
                    value={profile.dietary}
                    onChange={(event) => setProfile((current) => ({ ...current, dietary: event.target.value }))}
                  >
                    <option>Vegetarian</option>
                    <option>Vegan</option>
                    <option>Non-vegetarian</option>
                  </select>
                </label>

                <label>
                  <span>Goal</span>
                  <select
                    value={profile.goal}
                    onChange={(event) => setProfile((current) => ({ ...current, goal: event.target.value }))}
                  >
                    <option>Weight Loss</option>
                    <option>Weight Gain</option>
                    <option>Maintenance</option>
                    <option>Balanced Diet</option>
                  </select>
                </label>

                <label>
                  <span>Calories</span>
                  <input
                    type="number"
                    value={profile.calories}
                    onChange={(event) => setProfile((current) => ({ ...current, calories: Number(event.target.value) || 0 }))}
                  />
                </label>

                <label className="profile-filter">
                  <span>Explore category</span>
                  <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}>
                    {CATEGORY_OPTIONS.map((category) => <option key={category}>{category}</option>)}
                  </select>
                </label>
              </div>
            </div>

            <div className="recommend-card">
              <h3>Smart Recommendations</h3>
              <ul>
                {recommendations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="grocery-card">
              <h3>Grocery List</h3>
              {groceryList.length ? (
                <ul>
                  {groceryList.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p>No items added yet. Select a meal to build your shopping list.</p>
              )}
            </div>
          </aside>

          <section className="planner-main">
            <div className="summary-strip">
              <div>
                <span>Daily avg</span>
                <strong>{Math.round(totals.calories / 7)} kcal</strong>
              </div>
              <div>
                <span>Protein</span>
                <strong>{Math.round(totals.protein / 7)} g</strong>
              </div>
              <div>
                <span>Carbs</span>
                <strong>{Math.round(totals.carbs / 7)} g</strong>
              </div>
              <div>
                <span>Fat</span>
                <strong>{Math.round(totals.fat / 7)} g</strong>
              </div>
            </div>

            <div className="week-grid">
              {plan.map((dayPlan, dayIndex) => (
                <div className="day-card" key={dayPlan.day}>
                  <div className="day-card-header">
                    <h4>{dayPlan.day}</h4>
                  </div>

                  <div className="meal-stack">
                    {MEAL_SLOTS.map((slot) => {
                      const meal = dayPlan.meals[slot]
                      const isSaved = savedMeals.includes(getMealKey(dayPlan.day, slot, meal.name))

                      return (
                        <div
                          className="meal-item"
                          key={`${dayPlan.day}-${slot}`}
                          onClick={() => {
                            setSelectedDay(dayPlan.day)
                            setSelectedMealSlot(slot)
                            setSelectedMeal(meal)
                            setSelectedRecipe(meal)
                            setDetailMode('recipe')
                            setRecipeModalOpen(true)
                            setSwapModalOpen(false)
                          }}
                        >
                          <div className="meal-topline">
                            <span className="meal-slot">{slot}</span>
                            {isSaved && <span className="saved-pill">Saved</span>}
                          </div>
                          <img className="meal-item-image" src={meal.image} alt="" onError={handleRecipeImageError} />
                          <strong>{meal.name}</strong>
                          <div className="meal-meta">
                            <span>{meal.calories} kcal</span>
                            <span>{meal.protein}g protein</span>
                          </div>

                          <div className="meal-actions">
                            <button type="button" onClick={(event) => handleViewRecipe(dayPlan.day, slot, meal, event)}>View Recipe</button>
                            <button type="button" onClick={(event) => handleSwapMeal(dayPlan.day, slot, meal, event)}>Swap Meal</button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </section>

        {selectedRecipe && (recipeModalOpen || swapModalOpen) && (
          <div className="meal-modal-backdrop" role="presentation" onClick={handleCloseRecipe}>
            <section className="recipe-detail-card meal-modal" role="dialog" aria-modal="true" aria-labelledby="meal-modal-title" onClick={(event) => event.stopPropagation()}>
              {statusMessage && (
                <div className="status-banner">{statusMessage}</div>
              )}

              <div className="recipe-header">
                <div className="recipe-main-title">
                  <span className="recipe-badge">{selectedRecipe.slot}</span>
                  <h2 id="meal-modal-title">{selectedRecipe.name}</h2>
                  <p className="recipe-description">{selectedRecipe.description}</p>
                </div>

                <div className="recipe-tools">
                  <button type="button" onClick={() => handleAddToGroceryList(selectedRecipe)}>Add to Grocery List</button>
                  <button type="button" onClick={() => handleSaveMeal(selectedDay, selectedMealSlot)}>
                    {isCurrentMealSaved ? 'Saved ✓' : 'Save Meal'}
                  </button>
                  <button type="button" className="btn-secondary" onClick={handleCloseRecipe}>Close</button>
                </div>
              </div>

              {detailMode === 'swap' && swapModalOpen && swapOptions.length > 0 && (
                <div className="swap-panel">
                  <h3>Swap Meal Recommendations</h3>
                  <div className="swap-grid">
                    {swapOptions.map((option) => (
                      <div key={option.name} className="swap-option">
                        <img src={option.image} alt={option.name} onError={handleRecipeImageError} />
                        <strong>{option.name}</strong>
                        <span>{option.calories} kcal • {option.protein}g protein</span>
                        <p>{option.description}</p>
                        <button type="button" onClick={() => handleChooseAlternative(option)}>Select Meal</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detailMode === 'recipe' && recipeModalOpen && (
                <>
                  <div className="recipe-visual">
                    <img src={selectedRecipe.image} alt={selectedRecipe.name} onError={handleRecipeImageError} />
                    <a className="recipe-source" href={selectedRecipe.sourceLink} target="_blank" rel="noreferrer">Photo source: {selectedRecipe.source}</a>
                  </div>

                  <div className="nutrient-grid">
                    <div><span>Calories</span><strong>{selectedRecipe.calories} kcal</strong></div>
                    <div><span>Protein</span><strong>{selectedRecipe.protein} g</strong></div>
                    <div><span>Carbs</span><strong>{selectedRecipe.carbs} g</strong></div>
                    <div><span>Fat</span><strong>{selectedRecipe.fat} g</strong></div>
                  </div>

                  <div className="recipe-content">
                    <div className="recipe-section">
                      <h3>Ingredients</h3>
                      <ul>
                        {selectedRecipe.ingredients.map((ingredient, index) => (
                          <li key={ingredient}>{ingredient} <span className="ingredient-quantity">({selectedRecipe.ingredientQuantities[index]})</span></li>
                        ))}
                      </ul>
                    </div>

                    <div className="recipe-section">
                      <h3>Nutrition Highlights</h3>
                      <p>{selectedRecipe.vitamins}</p>
                      <p><strong>Prep time:</strong> {selectedRecipe.prepTime} minutes</p>
                      <p><strong>Cooking time:</strong> {selectedRecipe.cookingTime} minutes</p>
                      <p><strong>Serving size:</strong> {selectedRecipe.servingSize}</p>
                      <p><strong>Quantity:</strong> {selectedRecipe.quantity}</p>
                    </div>

                    <div className="recipe-section wide">
                      <h3>Preparation</h3>
                      <ol className="preparation-steps">
                        {selectedRecipe.steps.map((step, index) => (
                          <li key={`${selectedRecipe.name}-step-${index}`}>
                            <span className="step-number">{String(index + 1).padStart(2, '0')}</span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </>
              )}
            </section>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}

export default MealPlanner
