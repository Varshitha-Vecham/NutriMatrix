import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { apiRequest, OCR_API_URL } from '../api.js'
import { addIngredientsToSmartCart } from './Products.jsx'
import './RecipeGenerator.css'

const preferences = {
  meal_type: ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Any'],
  cuisine: ['Indian', 'South Indian', 'North Indian', 'Any'],
  time: ['Under 15 minutes', '15–30 minutes', '30–60 minutes', 'Any'],
  difficulty: ['Easy', 'Medium', 'Any']
}
const blankPreferences = { meal_type: 'Any', cuisine: 'Any', time: 'Any', difficulty: 'Any' }

function normaliseRecipe(recipe, index) {
  const safeIngredients = Array.isArray(recipe?.ingredients) ? recipe.ingredients : []
  const safeAvailable = Array.isArray(recipe?.available_ingredients) ? recipe.available_ingredients : []
  const safeAdditional = Array.isArray(recipe?.additional_ingredients) ? recipe.additional_ingredients : []
  const safeSteps = Array.isArray(recipe?.steps) ? recipe.steps : []
  const safeSwaps = Array.isArray(recipe?.healthier_swaps) ? recipe.healthier_swaps : []

  return {
    id: recipe?.id ?? `${recipe?.name ?? 'recipe'}-${index}`,
    name: String(recipe?.name || `Recipe ${index + 1}`),
    description: String(recipe?.description || 'A practical dish made from your ingredients.'),
    available_ingredients: safeAvailable.map((item) => String(item)).filter(Boolean),
    additional_ingredients: safeAdditional.map((item) => String(item)).filter(Boolean),
    preparation_time: String(recipe?.preparation_time || '25 minutes'),
    difficulty: String(recipe?.difficulty || 'Easy'),
    ingredients: safeIngredients.map((item) => ({
      name: String(item?.name || 'Ingredient'),
      quantity: String(item?.quantity || 'As needed')
    })),
    steps: safeSteps.map((step) => String(step)).filter(Boolean),
    estimated_nutrition: {
      calories: String(recipe?.estimated_nutrition?.calories || 'Estimated'),
      protein: String(recipe?.estimated_nutrition?.protein || 'Estimated'),
      carbohydrates: String(recipe?.estimated_nutrition?.carbohydrates || 'Estimated'),
      fat: String(recipe?.estimated_nutrition?.fat || 'Estimated'),
      fiber: String(recipe?.estimated_nutrition?.fiber || 'Estimated')
    },
    healthier_swaps: safeSwaps.map((swap) => String(swap)).filter(Boolean)
  }
}

export default function RecipeGenerator() {
  const navigate = useNavigate()
  const [ingredients, setIngredients] = useState([])
  const [draft, setDraft] = useState('')
  const [choices, setChoices] = useState(blankPreferences)
  const [mode, setMode] = useState('only')
  const [recipes, setRecipes] = useState([])
  const [expanded, setExpanded] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [cartItemsAdded, setCartItemsAdded] = useState(false)
  const [saved, setSaved] = useState(() => { try { return JSON.parse(localStorage.getItem('nutrimatrix-saved-recipes') || '[]') } catch { return [] } })

  function parseDraftIngredients(value) {
    return value
      .split(/[,;\n]+/)
      .map((item) => item.trim())
      .filter(Boolean)
  }

  function addDraft(value = draft) {
    const additions = parseDraftIngredients(value)
    setIngredients((current) => [...new Map([...current, ...additions].map((item) => [item.toLocaleLowerCase(), item])).values()].slice(0, 30))
    setDraft('')
  }

  async function generate(excludeNames = []) {
    const pendingIngredients = parseDraftIngredients(draft)
    const allIngredients = [...new Map([...ingredients, ...pendingIngredients].map((item) => [item.toLocaleLowerCase(), item])).values()].slice(0, 30)

    if (!allIngredients.length) {
      setError('Please enter at least one ingredient to generate a recipe.')
      return
    }

    if (pendingIngredients.length) {
      setIngredients(allIngredients)
      setDraft('')
    }

    const requestBody = { ingredients: allIngredients, ...choices, mode, exclude_names: excludeNames }
    const apiUrl = `${OCR_API_URL}/api/generate-recipes`

    console.log('[RecipeGenerator] Request payload:', requestBody)
    console.log('[RecipeGenerator] API URL:', apiUrl)

    setLoading(true)
    setError('')
    setMessage('')

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 45000)

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      })

      const data = await response.json().catch(() => ({}))
      console.log('[RecipeGenerator] API response:', { status: response.status, data })

      if (!response.ok) {
        throw new Error(data.message || 'Recipe generation is temporarily unavailable. Please make sure Ollama is running and try again.')
      }

      const nextRecipes = Array.isArray(data.recipes) ? data.recipes.map((recipe, index) => normaliseRecipe(recipe, index)) : []
      if (!nextRecipes.length) {
        throw new Error("We couldn't generate a recipe this time. Please try again with a few more ingredients.")
      }

      setRecipes(nextRecipes)
      setExpanded({})
    } catch (e) {
      console.error('[RecipeGenerator] Generation failed:', e)
      const message = e?.name === 'AbortError'
        ? 'Recipe generation timed out. Please check that Ollama is running and try again.'
        : e?.message || 'Recipe generation is temporarily unavailable. Please make sure Ollama is running and try again.'
      setError(message)
    } finally {
      clearTimeout(timeoutId)
      setLoading(false)
    }
  }

  async function usePantry() {
    setError(''); setMessage('')
    try {
      const { products = [] } = await apiRequest('/api/expiry-products')
      const fresh = products.filter((item) => item.name && (!item.expiryDate || item.daysRemaining >= 0))
      const values = [...new Set(fresh.map((item) => item.name.trim()).filter(Boolean))]
      if (!values.length) { setError('Your Digital Pantry has no available ingredients yet.'); return }
      setIngredients(values.slice(0, 30)); setMessage(`${Math.min(values.length, 30)} available pantry ingredients loaded.`)
    } catch (e) {
      if (e.message === 'Not authenticated.') {
        if (window.location.pathname === '/recipe-generator') {
          setMessage('Login is required for your Digital Pantry, but you can still generate recipes manually.')
          return
        }
        navigate('/login')
        return
      }
      setError('Could not load your Digital Pantry. Please try again.')
    }
  }

  function saveRecipe(recipe) {
    const next = saved.some((item) => item.name === recipe.name) ? saved : [...saved, recipe]
    setSaved(next); localStorage.setItem('nutrimatrix-saved-recipes', JSON.stringify(next)); setMessage(`${recipe.name} saved on this device.`)
  }

  function addMissing(recipe) {
    const result = addIngredientsToSmartCart(recipe.additional_ingredients || [])
    setCartItemsAdded(result.added > 0)
    setMessage(result.added ? `${result.added} available product${result.added === 1 ? '' : 's'} added to SmartCart.${result.unavailable.length ? ` Not in the current product catalog: ${result.unavailable.join(', ')}.` : ''}` : 'These missing ingredients are not in the current SmartCart product catalog.')
  }

  useEffect(() => { document.title = 'Recipe Generator | NutriMatrix' }, [])

  return <div className="recipe-page"><Navbar /><main className="recipe-shell">
    <header className="recipe-hero"><span className="recipe-eyebrow">NUTRIMATRIX · YOUR KITCHEN, REIMAGINED</span><h1>What do you have today?</h1><p>Tell us the ingredients you have, and NutriMatrix will create recipes you can prepare.</p></header>
    <section className="recipe-input-card" aria-labelledby="ingredients-title">
      <div className="recipe-section-heading"><span className="recipe-step">01</span><div><h2 id="ingredients-title">Ingredients You Have</h2><p>Add what’s on hand. Separate items with commas or add them one at a time.</p></div><button type="button" className="pantry-button" onClick={usePantry}>Use My Digital Pantry</button></div>
      <div className="ingredient-entry"><textarea value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addDraft() } }} placeholder="Example: rice, tomato, onion, paneer, capsicum..." aria-label="Ingredients you have" /><button type="button" onClick={() => addDraft()}>＋ Add Ingredient</button></div>
      {ingredients.length > 0 ? <div className="ingredient-chips" aria-label="Added ingredients">{ingredients.map((name) => <span className="ingredient-chip" key={name}>{name}<button type="button" aria-label={`Remove ${name}`} onClick={() => setIngredients((items) => items.filter((item) => item !== name))}>×</button></span>)}</div> : <p className="ingredient-hint">Your ingredients will appear here as removable chips.</p>}
      <div className="recipe-preferences"><div className="recipe-section-heading compact"><span className="recipe-step">02</span><div><h2>Recipe preferences <small>Optional</small></h2><p>Set a direction or leave everything on Any.</p></div></div><div className="recipe-select-grid">{Object.entries(preferences).map(([key, options]) => <label key={key}>{({ meal_type: 'Meal Type', cuisine: 'Cuisine', time: 'Preparation Time', difficulty: 'Difficulty' })[key]}<select value={choices[key]} onChange={(e) => setChoices({ ...choices, [key]: e.target.value })}>{options.map((option) => <option key={option}>{option}</option>)}</select></label>)}</div>
        <fieldset className="recipe-mode"><legend>Ingredient mode</legend><label><input type="radio" name="mode" value="only" checked={mode === 'only'} onChange={() => setMode('only')} /><span><b>Use Only My Ingredients</b><small>Only your ingredients and basic cooking essentials.</small></span></label><label><input type="radio" name="mode" value="additional" checked={mode === 'additional'} onChange={() => setMode('additional')} /><span><b>Allow Additional Ingredients</b><small>Recipes may need up to two extra ingredients.</small></span></label></fieldset>
      </div>
      {error && <p className="recipe-alert" role="alert">{error}</p>}{message && <p className="recipe-notice" role="status">{message}{cartItemsAdded && <button type="button" className="view-cart-link" onClick={() => navigate('/products')}>View SmartCart</button>}</p>}
      <button className="generate-button" type="button" onClick={() => generate()} disabled={loading}>{loading ? <><span className="recipe-spinner" /> Creating recipes from your ingredients...</> : '✦ Generate Recipes'}</button>
    </section>
    {recipes.length > 0 && <section className="recipe-results"><div className="results-heading"><div><span className="recipe-eyebrow">MADE FOR WHAT YOU HAVE</span><h2>Recipes for you</h2><p>{recipes.length} ideas created with your ingredients.</p></div><button type="button" className="another-button" disabled={loading} onClick={() => generate(recipes.map((r) => r.name))}>↻ Generate Another Recipe</button></div>
      <div className="recipe-grid">{recipes.map((recipe, index) => <article className="suggestion-card" key={`${recipe.name}-${index}`}><div className="suggestion-top"><span className="recipe-number">RECIPE {String(index + 1).padStart(2, '0')}</span><span className="difficulty-pill">{recipe.difficulty}</span></div><h3>{recipe.name}</h3><p className="suggestion-description">{recipe.description}</p><div className="suggestion-meta"><span>◷ {recipe.preparation_time}</span><span>·</span><span>{recipe.difficulty}</span></div><div className="available-list"><b>You Have</b><div>{(recipe.available_ingredients || []).map((item) => <span key={item}>✓ {item}</span>)}</div></div>{(recipe.additional_ingredients || []).length > 0 && <div className="additional-list"><b>Additional Ingredients Needed</b><div>{(recipe.additional_ingredients || []).map((item) => <span key={item}>＋ {item}</span>)}</div></div>}
        <div className="suggestion-actions"><button type="button" className="view-button" onClick={() => setExpanded({ ...expanded, [index]: !expanded[index] })}>{expanded[index] ? 'Hide Recipe' : 'View Recipe'}</button><button type="button" className="save-button" onClick={() => saveRecipe(recipe)}>{saved.some((item) => item.name === recipe.name) ? '♥ Saved' : '♡ Save Recipe'}</button></div>
        {(recipe.additional_ingredients || []).length > 0 && <button type="button" className="cart-button" onClick={() => addMissing(recipe)}>＋ Add Missing Ingredients to SmartCart</button>}
        {expanded[index] && <div className="recipe-detail"><section><h4>Ingredients</h4><ul>{(recipe.ingredients || []).map((item, i) => <li key={`${item.name}-${i}`}>{item.name} <span>{item.quantity}</span></li>)}</ul></section><section><h4>Preparation</h4><ol>{(recipe.steps || []).map((step, i) => <li key={i}><b>{i + 1}.</b> {step}</li>)}</ol></section><section className="nutrition-estimate"><h4>Estimated Nutrition</h4><p>AI estimates for guidance only; values are not verified.</p><div>{Object.entries(recipe.estimated_nutrition || {}).map(([key, value]) => <span key={key}><b>{key.replace('_', ' ')}</b>{value}</span>)}</div></section>{(recipe.healthier_swaps || []).length > 0 && <section><h4>Healthier Swaps</h4><ul>{(recipe.healthier_swaps || []).map((swap, i) => <li key={i}>{swap}</li>)}</ul></section>}</div>}
      </article>)}</div>
    </section>}
  </main><Footer /></div>
}
