// A single source of truth for preference matching in the browser. Allergies
// are safety restrictions; dislikes use the same substitution flow but are
// presented as preferences rather than an allergy-safety guarantee.
const GROUPS = {
  peanut: ['peanut', 'peanuts', 'groundnut', 'groundnuts', 'peanut butter', 'arachis'],
  milk: ['milk', 'dairy', 'lactose', 'casein', 'whey', 'butter', 'ghee', 'cheese', 'paneer', 'yogurt', 'curd', 'cream'],
  egg: ['egg', 'eggs', 'albumin', 'mayonnaise'],
  soy: ['soy', 'soya', 'soybean', 'tofu', 'tempeh', 'edamame', 'soy milk', 'soy sauce'],
  almond: ['almond', 'almonds', 'almond milk', 'almond butter'],
  wheat: ['wheat', 'atta', 'maida', 'semolina', 'suji', 'bread', 'roti', 'chapati', 'pasta', 'noodles', 'vermicelli'],
  sesame: ['sesame', 'til', 'tahini'],
  fish: ['fish', 'anchovy', 'tuna', 'salmon', 'prawn', 'shrimp'],
  shellfish: ['shellfish', 'prawn', 'shrimp', 'crab', 'lobster'],
  tree_nut: ['cashew', 'walnut', 'pistachio', 'hazelnut', 'pecan', 'macadamia']
}

const SUBSTITUTIONS = {
  peanut: ['pumpkin seeds', 'sunflower seeds'],
  milk: ['oat milk', 'coconut milk'],
  egg: ['flaxseed gel', 'mashed banana'],
  soy: ['chickpeas', 'lentils'],
  almond: ['sunflower seeds', 'pumpkin seeds'],
  wheat: ['rice flour', 'millet flour'],
  sesame: ['sunflower seeds', 'pumpkin seeds'],
  fish: ['chickpeas', 'lentils'],
  shellfish: ['chickpeas', 'lentils'],
  tree_nut: ['pumpkin seeds', 'sunflower seeds']
}

export function splitRestrictions(value) {
  return Array.isArray(value) ? value.flatMap(splitRestrictions) : String(value || '').split(/[,;\n]/).map((item) => item.trim()).filter(Boolean)
}

function key(value) { return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() }

export function allergenGroups(values) {
  return splitRestrictions(values).map((item) => {
    const normalized = key(item)
    return Object.keys(GROUPS).find((group) => GROUPS[group].some((alias) => normalized.includes(alias))) || normalized
  }).filter(Boolean)
}

export function matchesRestriction(ingredient, restrictions) {
  const candidate = key(ingredient)
  return allergenGroups(restrictions).some((group) => {
    const aliases = (GROUPS[group] || [group]).filter((alias) => {
      if (group === 'milk' && alias === 'milk' && /^(oat|coconut|rice|soy|almond) milk$/.test(candidate)) return false
      if (group === 'wheat' && /^(rice|millet) (noodles|pasta|bread|roti)$/.test(candidate) && ['noodles', 'pasta', 'bread', 'roti'].includes(alias)) return false
      return true
    })
    return aliases.some((alias) => candidate.includes(alias))
  })
}

function substitutionsForIngredient(name, group) {
  const ingredient = key(name)
  if (group === 'milk') {
    if (/butter|ghee/.test(ingredient)) return ['olive oil', 'coconut oil']
    if (/cheese/.test(ingredient)) return ['nutritional yeast', 'coconut yogurt']
    if (/paneer/.test(ingredient)) return ['chickpea tofu', 'mushrooms']
    if (/yogurt|curd|cream/.test(ingredient)) return ['coconut yogurt', 'coconut cream']
    return ['oat milk', 'coconut milk']
  }
  if (group === 'egg') return /omelet|bhurji|scramble/.test(ingredient) ? ['chickpea flour scramble', 'tofu scramble'] : SUBSTITUTIONS.egg
  if (group === 'wheat') {
    if (/pasta|noodle|vermicelli/.test(ingredient)) return ['rice noodles', 'rice pasta']
    if (/bread|roti|chapati|naan/.test(ingredient)) return ['millet roti', 'rice bread']
  }
  return SUBSTITUTIONS[group] || []
}

export function applyAllergySubstitutions(recipe, allergies = [], dislikes = []) {
  const allergyGroups = allergenGroups(allergies)
  const allRestrictions = [...splitRestrictions(allergies), ...splitRestrictions(dislikes)]
  const ingredients = Array.isArray(recipe?.ingredients) ? recipe.ingredients : []
  const substitutions = []
  let unavailable = false
  const nextIngredients = ingredients.map((ingredient) => {
    const name = typeof ingredient === 'string' ? ingredient : ingredient?.name
    if (!matchesRestriction(name, allRestrictions)) return ingredient
    const group = allergenGroups([name]).find((item) => allergyGroups.includes(item)) || allergenGroups([name])[0]
    const replacement = substitutionsForIngredient(name, group).find((candidate) => !matchesRestriction(candidate, allRestrictions))
    if (!replacement) { unavailable = true; return ingredient }
    substitutions.push({ from: name, to: replacement, safety: allergenGroups([name]).some((item) => allergyGroups.includes(item)) })
    return typeof ingredient === 'string' ? replacement : { ...ingredient, name: replacement }
  })
  const changed = substitutions.length > 0
  const title = changed && recipe?.name ? `${recipe.name} (${substitutions.some((item) => item.safety) ? 'allergy-aware' : 'preference-adjusted'})` : recipe?.name
  return { ...recipe, name: title, ingredients: nextIngredients, substitutions, safe: !unavailable, safetyNotice: allergyGroups.length ? 'Ingredient matches and substitutions are based on available recipe information; verify packaged ingredients and cross-contact risk.' : '' }
}
