import { useEffect, useMemo, useState } from 'react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import './MealPlanner.css'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MEAL_SLOTS = ['Breakfast', 'Morning Snack', 'Lunch', 'Evening Snack', 'Dinner']

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
    }
  ]
}

const defaultProfile = {
  age: 29,
  dietary: 'Vegetarian',
  goal: 'Balanced Diet',
  calories: 2200,
  pantry: ['oats', 'berries', 'Greek yogurt', 'spinach', 'eggs', 'quinoa', 'tomato', 'broccoli', 'brown rice', 'lentils', 'banana', 'cinnamon', 'almond milk']
}

const STORAGE_KEY = 'nutrimatrix-saved-meals'

function enrichMeal(meal, slot) {
  return {
    ...meal,
    slot,
    image: meal.image || 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80',
    servingSize: meal.servingSize || '1 serving',
    quantity: meal.quantity || '1 plate',
    cookingTime: meal.cookingTime || (meal.prepTime ? meal.prepTime + 10 : 20),
    description: meal.description || 'Fresh and nutritionally balanced meal suggestion.'
  }
}

function normalizeDietary(preference) {
  if (preference === 'Vegan') return ['Vegan', 'Vegetarian']
  if (preference === 'Vegetarian') return ['Vegetarian']
  return ['Non-vegetarian', 'Vegetarian']
}

function getFoodOptions(slot, profile) {
  return mealLibrary[slot].filter((recipe) => {
    const allowedDiets = normalizeDietary(profile.dietary)
    const matchesDiet = recipe.dietary.some((diet) => allowedDiets.includes(diet))
    const matchesGoal = recipe.goal.includes(profile.goal)
    return matchesDiet && matchesGoal
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
    setSwapOptions(getFoodOptions(slot, profile).filter((recipe) => recipe.name !== meal.name))
  }

  const handleSwapMeal = (day, slot, currentMeal, event) => {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }

    const options = getFoodOptions(slot, profile).filter((recipe) => recipe.name !== currentMeal.name)
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

  const foodOptions = getFoodOptions(selectedMealSlot, profile)
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
                  onClick={() => setSelectedDay(day)}
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
                  onClick={() => setSelectedMealSlot(slot)}
                >
                  {slot}
                </button>
              ))}
            </div>

            <div className="food-picker-block">
              <div className="food-picker-header">
                <h3>{selectedDay} - {selectedMealSlot}</h3>
                <span>{foodOptions.length} food options</span>
              </div>

              <div className="food-picker-grid">
                {foodOptions.map((food) => (
                  <button
                    key={food.name}
                    className={selectedMeal?.name === food.name ? 'food-item active' : 'food-item'}
                    onClick={() => handleSelectMealOption(food)}
                  >
                    <strong>{food.name}</strong>
                    <span>{food.calories} kcal</span>
                    <small>{food.protein}g protein</small>
                  </button>
                ))}
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
                          }}
                        >
                          <div className="meal-topline">
                            <span className="meal-slot">{slot}</span>
                            {isSaved && <span className="saved-pill">Saved</span>}
                          </div>
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
                        <img src={option.image} alt={option.name} />
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
                    <img src={selectedRecipe.image} alt={selectedRecipe.name} />
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
                        {selectedRecipe.ingredients.map((ingredient) => (
                          <li key={ingredient}>{ingredient}</li>
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
                        {selectedRecipe.instructions
                          .split(/, then |, and |, add |, top with |, serve |, pour |, fold in |, scramble |, season |, dress with |, roast |, sauté |, simmer |, combine |, spread |, mix |, toss |, cook /i)
                          .map((step, index) => (
                            <li key={`${selectedRecipe.name}-step-${index}`}>{step.trim()}</li>
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
