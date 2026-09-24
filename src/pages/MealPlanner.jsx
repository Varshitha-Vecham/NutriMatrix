import { useEffect, useMemo, useState } from 'react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { apiRequest } from '../api.js'
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
      instructions: 'Saute spinach, scramble eggs, fold in avocado and tomato, then cook until set.',
      dietary: ['Eggetarian'],
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
      instructions: 'Sear tofu, saute vegetables, and serve over brown rice with soy sauce.',
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
      instructions: 'Warm beans and rice, saute peppers and corn, then assemble with avocado.',
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
      instructions: 'Saute turkey and vegetables, add beans and rice, then stir-fry until fully cooked.',
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
      dietary: ['Eggetarian'], goal: ['Balanced Diet', 'Maintenance', 'Weight Gain'], categories: ['Breakfast', 'High Protein'],
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
      steps: ['Mix yogurt, lemon, and tandoori masala.', 'Coat the chicken and marinate for at least 30 minutes.', 'Roast at 220 C until browned and cooked through.', 'Rest for five minutes, slice, and serve with cucumber salad.'],
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
  'Chicken Lentil Stew': '/images/recipes/chicken-lentil-stew.jpg',
  'Palak Tofu Curry': '/images/recipes/palak-tofu-curry.jpg',
  'Roasted Makhana Chaat': '/images/recipes/roasted-makhana-chaat.jpg',
  'Paneer Butter Masala': '/images/recipes/paneer-butter-masala.jpg',
  'Overnight Mango Chia Oats': '/images/recipes/overnight-mango-chia-oats.jpg',
  'Curd Rice': 'https://images.unsplash.com/photo-1633383718081-22ac93e3db65?auto=format&fit=crop&w=900&q=85',
  'Masala Dosa': '/images/recipes/idli-sambar-plate.jpg',
  'Pulihora (Tamarind Rice)': '/images/recipes/south-indian-lemon-rice.jpg',
  'Chapati and Dal': '/images/recipes/lentil-veggie-curry.jpg',
  'Vegetable Upma': '/images/recipes/roasted-makhana-chaat.jpg',
  'Egg Bhurji with Chapati': '/images/recipes/avocado-spinach-omelet.jpg',
  'Vegetable Pulav': '/images/recipes/black-bean-fajita-bowl.jpg',
  'Chicken Biryani': '/images/recipes/tandoori-chicken-plate.jpg',
  'Fish Curry with Rice': '/images/recipes/salmon-sweet-potato-plate.jpg',
  'Chicken Sausage Egg Scramble': '/images/recipes/avocado-spinach-omelet.jpg',
  'Smoked Salmon Breakfast Toast': '/images/recipes/salmon-sweet-potato-plate.jpg',
  'Chicken Avocado Breakfast Bowl': '/images/recipes/quinoa-chicken-power-bowl.jpg',
  'Chicken Cucumber Bites': 'https://images.unsplash.com/photo-1782468654011-270157b7107f?auto=format&fit=crop&w=900&q=85',
  'Tuna Stuffed Pepper Cups': 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=900&q=85',
  'Turkey Roll-Ups': '/images/recipes/turkey-bean-stir-fry.jpg',
  'Boiled Egg Chaat': '/images/recipes/avocado-spinach-omelet.jpg',
  'Tuna Avocado Crackers': '/images/recipes/quinoa-chicken-power-bowl.jpg',
  'Chicken Pepper Skewers': '/images/recipes/tandoori-chicken-plate.jpg',
  'Turkey Quinoa Salad': '/images/recipes/quinoa-chicken-power-bowl.jpg',
  'Grilled Chicken Whole Wheat Wrap': '/images/recipes/tandoori-chicken-plate.jpg',
  'Chicken Tikka with Brown Rice': '/images/recipes/tandoori-chicken-plate.jpg',
  'Garlic Prawn Rice Bowl': '/images/recipes/salmon-sweet-potato-plate.jpg'
}

const DEFAULT_RECIPE_IMAGE = '/images/recipes/default-food.jpg'

const indianRecipes = {
  Breakfast: [
    ['Masala Dosa', ['rice and urad dal batter', 'potato masala', 'oil', 'sambar'], ['2 dosas', '3/4 cup', '1 tsp', '1 cup'], 420, 12, 68, 11, 'Iron, Folate, Vitamin C', ['Vegetarian', 'Vegan'], 15, 20],
    ['Vegetable Upma', ['rava', 'mixed vegetables', 'peanuts', 'curry leaves'], ['1 cup', '1/2 cup', '1 tbsp', '6 leaves'], 330, 9, 54, 9, 'Vitamin A, C, Magnesium', ['Vegetarian', 'Vegan'], 10, 15],
    ['Egg Bhurji with Chapati', ['eggs', 'onion', 'tomato', 'whole wheat chapati'], ['2 large', '1/4 cup', '1/2 cup', '2 chapatis'], 430, 23, 46, 17, 'Vitamin B12, Vitamin D, Iron', ['Eggetarian'], 10, 12]
  ],
  Lunch: [
    ['Pulihora (Tamarind Rice)', ['cooked rice', 'tamarind', 'peanuts', 'curry leaves'], ['1 1/2 cups', '2 tbsp', '2 tbsp', '8 leaves'], 440, 11, 70, 13, 'Vitamin E, Magnesium, Iron', ['Vegetarian', 'Vegan'], 12, 15],
    ['Vegetable Pulav', ['basmati rice', 'mixed vegetables', 'peas', 'curd'], ['1 cup uncooked', '1 cup', '1/4 cup', '1/2 cup'], 490, 14, 78, 13, 'Vitamin A, C, B12', ['Vegetarian'], 15, 25],
    ['Chicken Biryani', ['basmati rice', 'chicken', 'yogurt', 'onion', 'spices'], ['1 cup cooked', '150 g', '1/4 cup', '1 medium', '1 tsp'], 590, 38, 66, 18, 'Vitamin B6, B12, Zinc, Iron', ['Non-vegetarian'], 20, 35]
  ],
  Dinner: [
    ['Curd Rice', ['cooked rice', 'plain curd', 'milk', 'pomegranate'], ['1 cup', '3/4 cup', '1/4 cup', '2 tbsp'], 360, 12, 58, 8, 'Calcium, Vitamin B12, Potassium', ['Vegetarian'], 10, 10],
    ['Chapati and Dal', ['whole wheat atta', 'toor dal', 'tomato', 'spinach'], ['2 chapatis', '3/4 cup cooked', '1 medium', '1 cup'], 460, 22, 72, 10, 'Iron, Folate, Magnesium', ['Vegetarian', 'Vegan'], 15, 25],
    ['Fish Curry with Rice', ['fish fillet', 'coconut milk', 'cooked rice', 'tomato'], ['150 g', '1/4 cup', '1 cup', '1 medium'], 520, 34, 58, 16, 'Vitamin B12, Vitamin D, Selenium', ['Non-vegetarian'], 15, 25]
  ]
}

const extraNonVegetarianRecipes = {
  Breakfast: [
    ['Chicken Sausage Egg Scramble', ['eggs', 'chicken sausage', 'spinach', 'tomato'], ['2 large', '100 g', '1/2 cup', '1/2 cup'], 390, 32, 18, 21, 'Vitamin B12, Iron, Vitamin A', ['Non-vegetarian'], 10, 10],
    ['Smoked Salmon Breakfast Toast', ['smoked salmon', 'whole grain bread', 'cream cheese', 'cucumber'], ['90 g', '2 slices', '2 tbsp', '1/2 medium'], 360, 25, 34, 13, 'Vitamin D, B12, Omega-3', ['Non-vegetarian'], 8, 3],
    ['Chicken Avocado Breakfast Bowl', ['chicken breast', 'eggs', 'avocado', 'spinach'], ['100 g', '1 large', '1/2 medium', '1 cup'], 430, 39, 16, 23, 'Vitamin B6, B12, Folate', ['Non-vegetarian'], 12, 15]
  ],
  'Morning Snack': [
    ['Chicken Cucumber Bites', ['chicken breast', 'cucumber', 'Greek yogurt', 'dill'], ['90 g', '1 medium', '2 tbsp', '1 tsp'], 180, 27, 8, 5, 'Vitamin B6, B12, Calcium', ['Non-vegetarian'], 10, 12],
    ['Tuna Stuffed Pepper Cups', ['tuna', 'bell pepper', 'Greek yogurt', 'lemon'], ['90 g', '1 medium', '2 tbsp', '1 tsp'], 190, 25, 12, 4, 'Vitamin D, B12, Selenium', ['Non-vegetarian'], 10, 0],
    ['Turkey Roll-Ups', ['turkey breast', 'lettuce', 'cucumber', 'mustard'], ['90 g', '4 leaves', '1/2 medium', '1 tsp'], 160, 24, 7, 4, 'Vitamin B6, B12, Zinc', ['Non-vegetarian'], 8, 0]
  ],
  'Evening Snack': [
    ['Boiled Egg Chaat', ['eggs', 'tomato', 'onion', 'lemon'], ['2 large', '1 small', '1/4 small', '1 tsp'], 190, 14, 11, 10, 'Vitamin B12, Vitamin D, Choline', ['Non-vegetarian'], 8, 10],
    ['Tuna Avocado Crackers', ['tuna', 'avocado', 'whole grain crackers', 'lemon'], ['90 g', '1/4 medium', '6 crackers', '1 tsp'], 240, 23, 22, 9, 'Vitamin D, B12, Omega-3', ['Non-vegetarian'], 10, 0],
    ['Chicken Pepper Skewers', ['chicken breast', 'bell pepper', 'yogurt', 'paprika'], ['100 g', '1/2 medium', '2 tbsp', '1/2 tsp'], 210, 30, 10, 6, 'Vitamin B6, B12, Vitamin C', ['Non-vegetarian'], 10, 12]
  ],
  Lunch: [
    ['Turkey Quinoa Salad', ['turkey breast', 'quinoa', 'cucumber', 'spinach'], ['120 g', '3/4 cup cooked', '1/2 medium', '1 cup'], 480, 42, 44, 14, 'Iron, Vitamin B6, Folate', ['Non-vegetarian'], 15, 15],
    ['Grilled Chicken Whole Wheat Wrap', ['chicken breast', 'whole wheat wrap', 'lettuce', 'tomato'], ['120 g', '1 large', '1 cup', '1/2 medium'], 510, 40, 48, 16, 'Vitamin A, B6, B12', ['Non-vegetarian'], 12, 15]
  ],
  Dinner: [
    ['Chicken Tikka with Brown Rice', ['chicken breast', 'Greek yogurt', 'brown rice', 'bell pepper'], ['150 g', '1/4 cup', '1 cup cooked', '1/2 medium'], 560, 46, 52, 15, 'Vitamin B6, B12, Selenium', ['Non-vegetarian'], 15, 25],
    ['Garlic Prawn Rice Bowl', ['prawns', 'brown rice', 'broccoli', 'garlic'], ['150 g', '1 cup cooked', '1 cup', '2 cloves'], 520, 38, 58, 11, 'Iodine, Selenium, Vitamin C', ['Non-vegetarian'], 12, 15]
  ]
}

Object.entries(indianRecipes).forEach(([slot, recipes]) => {
  recipes.forEach(([name, ingredients, ingredientQuantities, calories, protein, carbs, fat, vitamins, dietary, prepTime, cookingTime]) => {
    mealLibrary[slot].push({ name, description: `${name}, prepared with familiar everyday ingredients.`, ingredients, ingredientQuantities, calories, protein, carbs, fat, vitamins, prepTime, cookingTime, instructions: `Prepare the ingredients and cook the ${name.toLowerCase()} until ready to serve.`, dietary, goal: ['Weight Loss', 'Balanced Diet', 'Maintenance', 'Weight Gain'], categories: [slot, 'South Indian', ...dietary], image: recipeImages[name] || DEFAULT_RECIPE_IMAGE, source: recipeImages[name]?.startsWith('https://') ? 'Unsplash' : 'NutriMatrix recipe' })
  })
})

Object.entries(extraNonVegetarianRecipes).forEach(([slot, recipes]) => {
  recipes.forEach(([name, ingredients, ingredientQuantities, calories, protein, carbs, fat, vitamins, dietary, prepTime, cookingTime]) => {
    mealLibrary[slot].push({ name, description: `${name}, made with simple everyday ingredients.`, ingredients, ingredientQuantities, calories, protein, carbs, fat, vitamins, prepTime, cookingTime, instructions: `Cook the ${name.toLowerCase()} until ready to serve.`, dietary, goal: ['Weight Loss', 'Balanced Diet', 'Maintenance', 'Weight Gain'], categories: [slot, 'High Protein'], image: recipeImages[name] || DEFAULT_RECIPE_IMAGE, source: recipeImages[name]?.startsWith('https://') ? 'Unsplash' : 'NutriMatrix recipe' })
  })
})

Object.values(mealLibrary).flat().forEach((recipe) => {
  recipe.image = recipe.image || recipeImages[recipe.name] || DEFAULT_RECIPE_IMAGE
})

const vegetarianPhotoCatalog = [...new Map(Object.values(mealLibrary).flat()
  .filter((recipe) => recipe.dietary?.some((diet) => diet === 'Vegetarian' || diet === 'Vegan'))
  .map((recipe) => [recipe.name, recipe])).values()]

const recipeSteps = {
  'Berry Oat Protein Bowl': ['Cook oats with milk or water until creamy.', 'Fold in chia seeds and Greek yogurt.', 'Top with berries and almonds, then serve warm.'],
  'Avocado Spinach Omelet': ['Whisk the eggs with a pinch of seasoning.', 'Saute spinach and tomato in olive oil.', 'Pour in the eggs, fold with avocado, and cook until set.'],
  'Chia Banana Smoothie': ['Add banana, almond milk, chia, peanut butter, and oats to a blender.', 'Blend until smooth and creamy.', 'Pour into a glass and serve immediately.'],
  'Apple Cinnamon Yogurt': ['Dice the apple into bite-sized pieces.', 'Spoon Greek yogurt into a bowl.', 'Add apple, cinnamon, and walnuts before serving.'],
  'Hummus Veggie Cups': ['Wash and slice the carrot, cucumber, and bell pepper.', 'Spoon hummus into small serving cups.', 'Arrange the vegetables and crackers around the hummus.'],
  'Quinoa Chicken Power Bowl': ['Cook quinoa according to the package directions.', 'Season and cook the chicken until it reaches 165 F internally.', 'Layer quinoa, spinach, tomato, chicken, and avocado in a bowl.'],
  'Chickpea Rainbow Salad': ['Rinse the chickpeas and cook or warm the quinoa.', 'Chop the spinach, tomato, and cucumber.', 'Toss everything with lemon juice and serve.'],
  'Tofu Rice Veggie Bowl': ['Cook the brown rice and press the tofu dry.', 'Sear tofu until golden on both sides.', 'Saute broccoli and carrot, then serve everything with soy sauce.'],
  'Cinnamon Banana Toast': ['Toast the whole grain bread until crisp.', 'Spread peanut butter over the toast.', 'Add banana slices and cinnamon.'],
  'Trail Mix Crunch': ['Measure almonds, pumpkin seeds, cranberries, and chocolate.', 'Combine everything in a bowl.', 'Portion into a small serving and store the rest airtight.'],
  'Cucumber Yogurt Dip': ['Dice the cucumber and chop the mint.', 'Stir cucumber and mint into Greek yogurt.', 'Serve with whole grain crackers.'],
  'Salmon Sweet Potato Plate': ['Roast the sweet potato until tender.', 'Season and bake the salmon until it flakes easily.', 'Steam broccoli and finish the plate with lemon.'],
  'Lentil Veggie Curry': ['Saute tomato and spinach with the lentils.', 'Add coconut milk and simmer until creamy and tender.', 'Serve the curry over warm brown rice.'],
  'Turkey Bean Stir-Fry': ['Brown the turkey mince with garlic.', 'Add bell pepper and cook until tender.', 'Stir in black beans and brown rice, then heat through.'],
  'Peanut Butter Apple Toast': ['Toast the whole grain bread until crisp.', 'Spread peanut butter over the toast.', 'Add apple slices and cinnamon.'],
  'Edamame Crunch Cup': ['Steam the edamame until tender.', 'Slice the cucumber and combine it with the edamame.', 'Finish with sesame seeds and lemon.'],
  'Black Bean Fajita Bowl': ['Warm the black beans and brown rice.', 'Saute bell pepper and corn until tender.', 'Assemble the bowl and top with avocado.'],
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
    ingredientQuantities: meal.ingredientQuantities || meal.ingredients.map((ingredient) => ({
      oats: '1/2 cup', berries: '1/2 cup', 'Greek yogurt': '1/2 cup', 'chia seeds': '1 tbsp', almonds: '1 tbsp', eggs: '2 large', spinach: '1 cup', avocado: '1/2 medium', tomato: '1 medium', 'olive oil': '1 tsp', banana: '1 medium', 'almond milk': '1 cup', 'peanut butter': '1 tbsp', 'whole grain bread': '2 slices', apple: '1 medium', cinnamon: '1/2 tsp', chickpeas: '3/4 cup', quinoa: '1 cup cooked', cucumber: '1/2 medium', tofu: '150 g', 'brown rice': '1 cup cooked', broccoli: '1 cup', carrot: '1 medium', salmon: '150 g', 'sweet potato': '1 medium', lentils: '3/4 cup cooked', 'coconut milk': '1/4 cup', 'turkey mince': '150 g', 'black beans': '3/4 cup', 'chicken breast': '150 g'
    }[ingredient] || '1/2 cup')),
    source: meal.source || 'Local recipe image',
    sourceLink: meal.sourceLink || meal.image || DEFAULT_RECIPE_IMAGE,
    servingSize: meal.servingSize || '1 serving',
    cookingTime: meal.cookingTime || (meal.prepTime ? meal.prepTime + 10 : 20),
  }
}

function handleRecipeImageError(event) {
  if (event.currentTarget.src.endsWith(DEFAULT_RECIPE_IMAGE)) return
  event.currentTarget.src = DEFAULT_RECIPE_IMAGE
}

function normalizeDietary(preference) {
  const normalized = String(preference || '').toLowerCase()
  if (normalized.includes('vegan')) return ['Vegan']
  if (normalized.includes('eggetarian')) return ['Eggetarian', 'Vegetarian', 'Vegan']
  if (normalized.includes('non-vegetarian') || normalized.includes('non vegetarian') || normalized.includes('non-veg') || normalized === 'nonveg') return ['Non-vegetarian', 'Eggetarian']
  if (normalized.includes('vegetarian') || normalized === 'veg') return ['Vegetarian', 'Vegan']
  return ['Non-vegetarian', 'Vegetarian', 'Vegan']
}

function normalizeGoal(goal) {
  const value = String(goal || '').toLowerCase()
  if (value.includes('gain')) return 'Weight Gain'
  if (value.includes('loss') || value.includes('management')) return 'Weight Loss'
  if (value.includes('protein')) return 'High Protein'
  if (value.includes('sugar')) return 'Low Sugar'
  if (value.includes('fiber') || value.includes('fibre')) return 'High Fiber'
  if (value.includes('maintain')) return 'Maintenance'
  return 'Balanced Diet'
}

function normalizeProfile(profile) {
  return { ...profile, goal: normalizeGoal(profile.goal) }
}

function hasAllergen(recipe, exclusions = '') {
  const allergens = String(exclusions || '').toLowerCase().split(/[,;\n]/).map((item) => item.trim()).filter(Boolean)
  const ingredients = recipe.ingredients.join(' ').toLowerCase()
  return allergens.some((allergen) => {
    const normalized = allergen.replace(/s$/, '')
    return ingredients.includes(normalized) || (normalized === 'peanut' && ingredients.includes('groundnut'))
  })
}

function scaleQuantity(quantity, members) {
  const match = String(quantity).match(/^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)(.*)$/)
  if (!match) return quantity
  const amount = match[1].includes(' ')
    ? Number(match[1].split(' ')[0]) + Number(match[1].split(' ')[1].split('/')[0]) / Number(match[1].split(' ')[1].split('/')[1])
    : match[1].includes('/') ? Number(match[1].split('/')[0]) / Number(match[1].split('/')[1]) : Number(match[1])
  const scaled = amount * members
  return `${Number.isInteger(scaled) ? scaled : Number(scaled.toFixed(2))}${match[2]}`
}

function getFoodOptions(slot, profile, category = 'All') {
  const recipes = slot === 'Morning Snack' || slot === 'Evening Snack'
    ? [...mealLibrary['Morning Snack'], ...mealLibrary['Evening Snack']]
    : mealLibrary[slot]
  const uniqueRecipes = [...new Map(recipes.map((recipe) => [recipe.name, recipe])).values()]
  return uniqueRecipes.filter((recipe) => {
    const allowedDiets = normalizeDietary(profile.dietary)
    const matchesDiet = String(profile.dietary || '').toLowerCase().includes('no preference')
      ? true
      : recipe.dietary.some((diet) => allowedDiets.includes(diet))
    const goal = normalizeGoal(profile.goal)
    const ingredients = recipe.ingredients.join(' ').toLowerCase()
    const snack = slot.includes('Snack')
    const matchesGoal = goal === 'High Protein' ? recipe.protein >= (snack ? 12 : 25)
      : goal === 'Low Sugar' ? !/honey|sugar|syrup|sweetened|dates|cranberr/i.test(ingredients) && recipe.carbs <= (snack ? 22 : 45)
        : goal === 'High Fiber' ? /beans|lentils|chickpea|oats|chia|vegetable|spinach/i.test(ingredients)
          : goal === 'Weight Loss' ? recipe.calories <= (snack ? 250 : 520) && recipe.protein >= (snack ? 8 : 15)
            : goal === 'Weight Gain' ? recipe.calories >= (snack ? 220 : 430)
              : goal === 'Maintenance' ? recipe.calories >= (snack ? 130 : 320) && recipe.calories <= (snack ? 300 : 650)
                : goal === 'Balanced Diet' ? recipe.calories >= (snack ? 130 : 300) && recipe.calories <= (snack ? 310 : 680) && recipe.protein >= (snack ? 5 : 10) && recipe.carbs <= (snack ? 42 : 85)
                  : recipe.goal.includes(goal)
    const categories = recipe.categories || [slot === 'Morning Snack' || slot === 'Evening Snack' ? 'Snacks' : slot, ...(recipe.dietary || [])]
    const matchesCategory = category === 'All' || categories.includes(category)
    return matchesDiet && matchesGoal && matchesCategory && !hasAllergen(recipe, profile.allergies) && !hasAllergen(recipe, profile.foodDislikes)
  })
}

// Keep a stable slot-specific recipe order, then rank eligible meals against
// the user's nutrition goal when creating the plan.
const WEEKLY_VARIETY_BY_SLOT = {
  Breakfast: ['Berry Oat Protein Bowl', 'Avocado Spinach Omelet', 'Chia Banana Smoothie', 'Peanut Butter Apple Toast', 'Masala Paneer Scramble', 'Overnight Mango Chia Oats', 'Masala Dosa', 'Vegetable Upma', 'Egg Bhurji with Chapati'],
  'Morning Snack': ['Apple Cinnamon Yogurt', 'Hummus Veggie Cups', 'Edamame Crunch Cup', 'Roasted Makhana Chaat', 'Peanut Sundal', 'Cucumber Yogurt Dip', 'Trail Mix Crunch'],
  Lunch: ['Chickpea Rainbow Salad', 'Tofu Rice Veggie Bowl', 'Black Bean Fajita Bowl', 'Paneer Butter Masala', 'South Indian Lemon Rice', 'Rajma Masala Rice', 'Pulihora (Tamarind Rice)', 'Vegetable Pulav', 'Chicken Biryani'],
  'Evening Snack': ['Cinnamon Banana Toast', 'Trail Mix Crunch', 'Cucumber Yogurt Dip', 'Roasted Chickpea Snack', 'Roasted Makhana Chaat', 'Peanut Sundal', 'Apple Cinnamon Yogurt'],
  Dinner: ['Lentil Veggie Curry', 'Palak Tofu Curry', 'Idli Sambar Plate', 'Rajma Masala Rice', 'Paneer Butter Masala', 'Curd Rice', 'Chapati and Dal', 'Fish Curry with Rice', 'Chicken Lentil Stew']
}

function getWeeklyFoodOptions(slot, profile) {
  const recipesByName = Object.values(mealLibrary).flat().reduce((recipes, recipe) => {
    recipes[recipe.name] = recipe
    return recipes
  }, {})
  const matchingRecipes = getFoodOptions(slot, profile)
  const goal = normalizeGoal(profile.goal)
  const scoreForGoal = (recipe) => {
    const calories = recipe.calories || 0
    if (goal === 'Weight Loss') return recipe.protein * 2 - calories / 35
    if (goal === 'Weight Gain') return calories / 16 + recipe.protein / 3
    if (goal === 'High Protein') return recipe.protein * 2 - calories / 100
    if (goal === 'Low Sugar') return recipe.protein * 1.5 - recipe.carbs / 2
    if (goal === 'High Fiber') return recipe.protein + (/beans|lentils|chickpea|oats|chia|vegetable|spinach/i.test(recipe.ingredients.join(' ')) ? 12 : 0)
    if (goal === 'Maintenance') return -Math.abs(calories - (slot.includes('Snack') ? 240 : 500)) + recipe.protein
    if (goal === 'Balanced Diet') {
      const targetCalories = slot.includes('Snack') ? 220 : 480
      return recipe.protein - Math.abs(calories - targetCalories) / 24 - Math.abs(recipe.carbs - (slot.includes('Snack') ? 24 : 55)) / 8
    }
    return recipe.protein - Math.abs(calories - (slot.includes('Snack') ? 240 : 500)) / 30
  }
  const variedOptions = WEEKLY_VARIETY_BY_SLOT[slot]
    .map((name) => recipesByName[name])
    .filter((recipe) => recipe && matchingRecipes.some((option) => option.name === recipe.name))

  if (variedOptions.length) {
    const selectedNames = new Set(variedOptions.map((recipe) => recipe.name))
    return [...variedOptions, ...matchingRecipes.filter((recipe) => !selectedNames.has(recipe.name))]
      .sort((a, b) => scoreForGoal(b) - scoreForGoal(a))
  }
  if (matchingRecipes.length) return [...matchingRecipes].sort((a, b) => scoreForGoal(b) - scoreForGoal(a))
  // Some combinations (for example a vegan high-protein breakfast) have a
  // smaller catalog. Keep the dietary and allergy filters intact and relax
  // only the goal threshold so the planner can still fill every slot.
  return getFoodOptions(slot, { ...profile, goal: 'Balanced Diet' })
}

function getSwapFoodOptions(slot, profile, category, currentName) {
  const goalMatches = getFoodOptions(slot, profile, category)
  const broadMatches = getFoodOptions(slot, profile, 'All')
  const balancedMatches = getFoodOptions(slot, { ...profile, goal: 'Balanced Diet' }, 'All')
  const slotRecipes = slot === 'Morning Snack' || slot === 'Evening Snack'
    ? [...mealLibrary['Morning Snack'], ...mealLibrary['Evening Snack']]
    : mealLibrary[slot] || []
  const allowedDiets = normalizeDietary(profile.dietary)
  const noDietPreference = String(profile.dietary || '').toLowerCase().includes('no preference')
  const candidates = [...new Map([...goalMatches, ...broadMatches, ...balancedMatches, ...slotRecipes]
    .filter((recipe) => recipe.name !== currentName && (noDietPreference || recipe.dietary.some((diet) => allowedDiets.includes(diet))) && !hasAllergen(recipe, profile.allergies) && !hasAllergen(recipe, profile.foodDislikes))
    .map((recipe) => [recipe.name, recipe])).values()]
  return candidates.slice(0, 6)
}

function rotateMeal(slot, profile, currentMeal) {
    const options = getFoodOptions(slot, profile)
  const currentIndex = options.findIndex((recipe) => recipe.name === currentMeal.name)
  const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % options.length : 0
  return { ...options[nextIndex], slot }
}

function buildMealPlan(profile) {
  return DAYS.map((day, dayIndex) => ({
    day,
    meals: MEAL_SLOTS.reduce((result, slot) => {
      const options = getWeeklyFoodOptions(slot, profile)
      const preferredMeal = options.length ? options[dayIndex % options.length] : null
      if (!preferredMeal) return result
      result[slot] = enrichMeal(preferredMeal, slot)
      return result
    }, {})
  }))
}

function MealPlanner() {
  const [profile, setProfile] = useState(defaultProfile)
  const [savedProfile, setSavedProfile] = useState(defaultProfile)
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [draftDiet, setDraftDiet] = useState('Vegetarian')
  const [draftGoal, setDraftGoal] = useState('Balanced Nutrition')
  const [saveAsDefault, setSaveAsDefault] = useState(false)
  const [memberCount, setMemberCount] = useState(1)
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
  const [savedMeals, setSavedMeals] = useState([])
  const [statusMessage, setStatusMessage] = useState('')
  const [wizardOpen, setWizardOpen] = useState(false)

  useEffect(() => {
    let active = true
    apiRequest('/api/profile').then((result) => {
      if (!active || !result?.hasProfile) return
      const saved = result.profile || {}
      const rawDiet = String(saved.dietType || 'no preference').toLowerCase()
      const displayDiet = rawDiet.includes('no preference') ? 'no preference' : rawDiet.includes('non') ? 'Non-Vegetarian' : rawDiet.includes('vegan') ? 'Vegan' : rawDiet.includes('egg') ? 'Eggetarian' : rawDiet.includes('vegetarian') ? 'Vegetarian' : 'no preference'
      const displayGoal = normalizeGoal(saved.goals || defaultProfile.goal)
      const nextProfile = normalizeProfile({ ...defaultProfile, dietary: displayDiet, goal: displayGoal, allergies: saved.allergies || '', foodDislikes: saved.foodDislikes || '' })
      const nextPlan = buildMealPlan(nextProfile)
      setProfile(nextProfile)
      setSavedProfile(nextProfile)
      setDraftDiet(nextProfile.dietary)
      setDraftGoal(nextProfile.goal === 'Balanced Diet' ? 'Balanced Nutrition' : nextProfile.goal === 'Maintenance' ? 'Maintain Weight' : nextProfile.goal)
      setPlan(nextPlan)
      setSelectedMeal(nextPlan[0].meals.Breakfast)
    }).catch(() => {})
    return () => { active = false }
  }, [])

  const applyPreferences = async () => {
    const nextProfile = normalizeProfile({ ...profile, dietary: draftDiet, goal: draftGoal })
    const nextPlan = buildMealPlan(nextProfile)
    setProfile(nextProfile)
    setPlan(nextPlan)
    setSelectedMeal(nextPlan[0].meals.Breakfast)
    setSelectedRecipe(null)
    if (saveAsDefault) {
      try {
        const result = await apiRequest('/api/profile')
        const current = result.profile || {}
        const dietType = draftDiet.toLowerCase() === 'no preference' ? 'no preference(veg&non-veg)' : draftDiet.toLowerCase()
        const goals = ({ 'Balanced Nutrition': 'balanced nutrition', 'High Protein': 'high-protein diet', 'Low Sugar': 'low-sugar diet', 'Maintain Weight': 'maintain weight', 'Weight Loss': 'weight loss', 'Weight Gain': 'weight gain' })[draftGoal] || draftGoal.toLowerCase()
        await apiRequest('/api/profile', { method: 'PUT', body: JSON.stringify({ ...current, dietType, goals }) })
        setSavedProfile(nextProfile)
      } catch (error) {
        setStatusMessage(`Plan updated; profile default could not be saved: ${error.message}`)
        setAdjustOpen(false)
        return
      }
    }
    setStatusMessage('Your meal plan has been updated based on your preferences.')
    setAdjustOpen(false)
  }

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
    setSwapOptions(getSwapFoodOptions(slot, profile, selectedCategory, meal.name)
      .map((recipe) => enrichMeal(recipe, slot)))
  }

  const handleSwapMeal = (day, slot, currentMeal, event) => {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }

    const options = getSwapFoodOptions(slot, profile, selectedCategory, currentMeal.name)
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

  const handleSaveMeal = (day, slot) => {
    const key = getMealKey(day, slot, selectedRecipe?.name || selectedMeal?.name || 'meal')
    const isSaved = savedMeals.includes(key)
    setSavedMeals(isSaved ? savedMeals.filter((savedKey) => savedKey !== key) : [...savedMeals, key])
    setStatusMessage(isSaved ? 'Recipe removed from saved meals.' : 'Recipe saved successfully.')
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
    setStatusMessage('Meal swapped successfully.')
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
            <span className="planner-badge">Smart Meal Planner</span>
            <h1>Weekly Nutrition Plan</h1>
            <p className="planner-description">Explore a full week of balanced meals tailored to your preferences. View recipes, compare nutrition, and swap dishes across breakfast, snacks, lunch, and dinner.</p>
          </div>
          <div className="planner-header-controls">
            <button type="button" className="btn-secondary adjust-preferences-trigger" onClick={() => { setDraftDiet(profile.dietary); setDraftGoal(profile.goal); setSaveAsDefault(false); setAdjustOpen((open) => !open) }}>Adjust Preferences</button>
            <label className="member-count-control">Prepare for<select value={memberCount} onChange={(event) => setMemberCount(Number(event.target.value))}>{[1, 2, 3, 4, 5, 6, 8, 10].map((count) => <option key={count} value={count}>{count} {count === 1 ? "person" : "people"}</option>)}</select></label>
          </div>
        </section>

        {adjustOpen && <section className="preference-panel">
          <div className="preference-panel-heading"><div><h2>Quick meal preferences</h2><p>Make a quick change to your preferences and update this week's meal plan.</p></div><button type="button" className="btn-secondary" onClick={() => setAdjustOpen(false)}>Cancel</button></div>
          <div className="preference-row">
            <label>Dietary preference<select value={draftDiet} onChange={(event) => setDraftDiet(event.target.value)}><option>no preference</option><option>Vegetarian</option><option>Non-Vegetarian</option></select></label>
            <label>Nutrition goal<select value={draftGoal} onChange={(event) => setDraftGoal(event.target.value)}><option>Balanced Nutrition</option><option>High Protein</option><option>Low Sugar</option><option>Maintain Weight</option><option>Weight Loss</option><option>Weight Gain</option></select></label>
            <label className="save-default-option"><input type="checkbox" checked={saveAsDefault} onChange={(event) => setSaveAsDefault(event.target.checked)} /> Save these changes as my default preferences</label>
            <button type="button" className="profile-save" onClick={applyPreferences}>Apply &amp; Update Plan</button>
          </div>
        </section>}

        {wizardOpen && (
          <section className="meal-wizard">
            <div className="wizard-header">
              <div>
                <span className="planner-badge">Weekly Setup</span>
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
                    <img src={enrichMeal(food, selectedMealSlot).image} alt={food.name} onError={handleRecipeImageError} />
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

        <details className="vegetarian-photo-catalog">
          <summary>Vegetarian dish photos ({vegetarianPhotoCatalog.length})</summary>
          <p>Browse the vegetarian dishes currently available in the meal planner.</p>
          <div className="vegetarian-photo-grid">
            {vegetarianPhotoCatalog.map((recipe) => (
              <a className="vegetarian-photo-card" href={recipe.image} target="_blank" rel="noreferrer" key={recipe.name}>
                <img src={recipe.image} alt={recipe.name} loading="lazy" onError={handleRecipeImageError} />
                <strong>{recipe.name}</strong>
              </a>
            ))}
          </div>
        </details>

        <section className="planner-layout">
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
                  <button
                    type="button"
                    className={selectedDay === dayPlan.day ? 'day-card-header active' : 'day-card-header'}
                    onClick={() => handleDayChange(dayPlan.day)}
                    aria-label={`Select ${dayPlan.day}`}
                  >
                    <span className="day-number">{String(dayIndex + 1).padStart(2, '0')}</span>
                    <span className="day-name">{dayPlan.day}</span>
                    <span className="day-label">Day</span>
                  </button>

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
                          <img className="meal-item-image" src={meal.image} alt={meal.name} onError={handleRecipeImageError} />
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
                  <button type="button" onClick={() => handleSaveMeal(selectedDay, selectedMealSlot)}>
                    {isCurrentMealSaved ? 'Unsave Meal' : 'Save Meal'}
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
                        <span>{option.calories} kcal | {option.protein}g protein</span>
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
                          <li key={ingredient}>{ingredient} <span className="ingredient-quantity">({scaleQuantity(selectedRecipe.ingredientQuantities[index], memberCount)})</span></li>
                        ))}
                      </ul>
                    </div>

                    <div className="recipe-section">
                      <h3>Nutrition Highlights</h3>
                      <p>{selectedRecipe.vitamins.split(',').map((nutrient) => `${nutrient.trim()}: ${/b12/i.test(nutrient) ? ' 0.5 to 2 mcg' : /magnesium/i.test(nutrient) ? ' 40 to 80 mg' : /iron/i.test(nutrient) ? ' 2 to 5 mg' : /calcium/i.test(nutrient) ? ' 100 to 250 mg' : /vitamin c/i.test(nutrient) ? ' 10 to 40 mg' : /vitamin a/i.test(nutrient) ? ' 100 to 400 mcg RAE' : /folate/i.test(nutrient) ? ' 50 to 120 mcg' : /vitamin d/i.test(nutrient) ? ' 1 to 5 mcg' : 'a useful dietary amount'}`).join(' | ')}</p>
                      <p><strong>Prep time:</strong> {selectedRecipe.prepTime} minutes</p>
                      <p><strong>Cooking time:</strong> {selectedRecipe.cookingTime} minutes</p>
                      <p><strong>Total time:</strong> {selectedRecipe.prepTime + selectedRecipe.cookingTime} minutes</p>
                      <p><strong>Serving size:</strong> {selectedRecipe.servingSize}</p>
                    </div>

                    <div className="recipe-section">
                      <h3>Healthy Alternatives</h3>
                      <ul>
                        {(selectedRecipe.ingredients.some((item) => /bread/i.test(item))
                          ? ['White bread to whole-grain bread', 'Sweetened peanut butter to unsweetened peanut butter']
                          : selectedRecipe.ingredients.some((item) => /rice/i.test(item))
                            ? ['White rice to brown rice', 'Excess oil to measured 1 tsp oil']
                            : ['Refined flour to whole wheat', 'Added sugar to fresh fruit']).map((alternative) => <li key={alternative}>{alternative}</li>)}
                      </ul>
                    </div>

                    <div className="recipe-section wide">
                      <h3>Preparation for {memberCount} {memberCount === 1 ? 'person' : 'people'}</h3>
                      <p>Ingredient amounts are scaled from the one person serving so you can prepare the same dish for everyone.</p>
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
