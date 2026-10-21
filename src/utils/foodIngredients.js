// A deliberately local food catalogue keeps validation reliable without a paid API
// or sending the user's pantry contents to another service.
const FOOD_TERMS = new Set(`rice wheat flour atta oats barley quinoa millet ragi bajra jowar maida suji pasta noodle vermicelli bread roti chapati bhakri paratha puri kulcha naan idli dosa appam upma khichdi pulao biryani
tomato onion potato milk egg paneer cheese butter ghee yogurt curd cream tofu chicken fish mutton turkey pork beef
dal lentil chickpea chana rajma bean pea soybean sprouts moong masoor urad lobia vatana chawli horsegram kulith moth
apple banana mango orange grape guava papaya pineapple pear kiwi watermelon pomegranate lemon lime coconut avocado berry strawberry jamun litchi chikoo sitaphal amla
carrot cabbage cauliflower broccoli spinach cucumber capsicum pumpkin beetroot corn mushroom garlic ginger coriander mint fenugreek methi okra bhindi brinjal eggplant bottle gourd bottlegourd snake gourd snakegourd ridge gourd ridgegourd bitter gourd bittergourd drumstick zucchini radish turnip colocasia arbi jackfruit plantain
oil olive mustard sunflower sesame salt sugar jaggery honey spice turmeric cumin chilli pepper cinnamon cardamom clove masala hing asafoetida ajwain kasuri saffron tamarind vinegar ketchup sauce chutney pickle papad
tea coffee peanut almond cashew walnut pistachio raisin date seed chia flax makhana poha cornflakes cereal biscuit chocolate namkeen sev chips wafer snack mixture
juice buttermilk coconut water beverage drink squash syrup jam jelly mayonnaise honey oats muesli granola noodles maggi kurkure lays biscuits cookies rusk cake breadspread
dal chawal sabzi curry korma kofta sambar rasam chutney thali bhel vada pav pakora samosa chole halwa kheer payasam lassi shrikhand icecream frozen`.split(/\s+/))

const NON_FOOD_TERMS = new Set(`soap shampoo detergent dishwashing dishwash liquid plastic bag bags utensil utensils cleaner cleaning product products bleach disinfectant sponge scrubber tissue toilet sanitary toothpaste toothbrush lotion perfume candle battery paper foil mop broom clothes cloth shirt tshirt trouser pant saree dress footwear shoe slipper electronics charger cable bulb toy stationery notebook`.split(/\s+/))

function words(value) {
  return String(value || '').toLocaleLowerCase().replace(/[^a-z\s-]/g, ' ').split(/[\s-]+/).filter(Boolean)
}

export function isFoodIngredient(value) {
  const ingredientWords = words(value)
  if (!ingredientWords.length || ingredientWords.some((word) => NON_FOOD_TERMS.has(word))) return false
  return ingredientWords.some((word) => FOOD_TERMS.has(word))
}

export function splitFoodIngredients(values) {
  const valid = []
  const invalid = []
  values.forEach((value) => (isFoodIngredient(value) ? valid : invalid).push(value))
  return { valid, invalid }
}
