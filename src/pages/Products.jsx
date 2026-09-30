import { useEffect, useMemo, useState } from 'react'
import Navbar from '../components/Navbar.jsx'
import './Products.css'

//const productImageFallback = (tags, id) => `https://loremflickr.com/700/500/${encodeURIComponent(tags.replaceAll(' ', ','))}/all?lock=${id}`
// Map product names to the exact files supplied in public/images/products.
const productImageFiles = {
  'Wheat Atta': 'wheat-atta.jpg', 'Multigrain Atta': 'multigrain-atta.jpg', 'Brown Rice': 'brown-rice.jpg', 'White Rice': 'white-rice.jpg', 'Basmati Rice': 'basmati-rice.jpg', 'Sona Masoori Rice': 'sona-masoori-rice.jpg', 'Quinoa': 'quinoa.jpg', 'Oats': 'oats.jpg', 'Poha': 'poha.jpg', 'Ragi Flour': 'ragi-flour.jpg', 'Jowar Flour': 'jowar-flour.jpg', 'Bajra Flour': 'bajra-flour.jpg', 'Maida': 'maida.jpg', 'Suji/Rava': 'suji-rava.jpg', 'Corn Flour': 'corn-flour.jpg',
  'Toor Dal': 'toor-dal.jpg', 'Moong Dal': 'moong-dal.jpg', 'Masoor Dal': 'masoor-dal.jpg', 'Chana Dal': 'chana-dal.jpg', 'Urad Dal': 'urad-dal.jpg', 'Moong Whole': 'moong-whole.webp', 'Green Gram': 'green-gram.webp', 'Rajma': 'rajma.jpg', 'Kabuli Chana': 'kabuli-chana.jpg', 'Black Chana': 'black-chana.jpg', 'Lobia': 'lobia.jpg', 'Soybeans': 'soybeans.jpg',
  'Milk': 'milk.jpg', 'Toned Milk': 'toned-milk.jpg', 'Full Cream Milk': 'full-cream-milk.jpg', 'Curd': 'curd.jpg', 'Greek Yogurt': 'greek-yogurt.jpg', 'Buttermilk': 'buttermilk.jpg', 'Paneer': 'paneer.jpg', 'Cheese': 'cheese.jpg', 'Soy Milk': 'soy-milk.jpg', 'Almond Milk': 'almond-milk.jpg',
  'Almonds': 'almonds.jpg', 'Cashews': 'cashews.jpg', 'Walnuts': 'walnuts.jpg', 'Pistachios': 'pistachios.jpg', 'Peanuts': 'peanuts.jpg', 'Raisins': 'raisins.jpg', 'Dates': 'dates.jpg', 'Chia Seeds': 'chia-seeds.jpg', 'Flax Seeds': 'flax-seeds.jpg', 'Pumpkin Seeds': 'pumpkin-seeds.jpg',
  'Apple': 'apple.jpg', 'Banana': 'banana.jpg', 'Orange': 'orange.jpg', 'Mango': 'mango.webp', 'Pomegranate': 'pomegranate.jpg', 'Papaya': 'papaya.jpg', 'Guava': 'guava.jpg', 'Watermelon': 'watermelon.png', 'Grapes': 'grapes.jpg', 'Pineapple': 'pineapple.webp', 'Pear': 'pear.webp', 'Kiwi': 'kiwi.webp',
  'Potato': 'potato.jpg', 'Tomato': 'tomato.jpg', 'Onion': 'onion.png', 'Carrot': 'carrot.webp', 'Spinach': 'spinach.jpg', 'Broccoli': 'broccoli.jpg', 'Cauliflower': 'cauliflower.jpg', 'Cabbage': 'cabbage.jpg', 'Beetroot': 'beetroot.jpg', 'Cucumber': 'cucumber.jpg', 'Capsicum': 'capsicum.jpg', 'Green Peas': 'greenpeas.webp',
  'Brown Bread': 'brown-bread.jpg', 'White Bread': 'white-bread.jpg', 'Multigrain Bread': 'multigrainbread.jpg', 'Corn Flakes': 'corn-flakes.jpg', 'Muesli': 'muesli.jpg', 'Granola': 'granola.jpg', 'Peanut Butter': 'peanut-butter.jpg', 'Almond Butter': 'almondbutter.jpg', 'Biscuits': 'biscuits.jpg', 'Digestive Biscuits': 'digestive-biscuits.jpg', 'Tomato Ketchup': 'tomatoketchup.jpg', 'Instant Noodles': 'instantnoodles.jpg', 'Pasta': 'pasta.jpg', 'Vermicelli': 'vermicelli.jpg', 'Ready-to-Eat Poha': 'readytoeatpoha.webp',
  'Coconut Water': 'coconutwater.jpg', 'Fruit Juice': 'fruitjuice.jpg', 'Green Tea': 'greentea.webp', 'Black Tea': 'blacktea.jpg', 'Coffee': 'coffee.jpg', 'Health Drink Powder': 'healthdrinkpowder.jpg', 'Soy Chunks': 'soychunks.jpg', 'Tofu': 'tofu.jpg', 'Honey': 'honey.webp', 'Jaggery': 'jaggery.jpg', 'Sugar': 'sugar.jpg', 'Cooking Oil': 'cookingoil.jpg', 'Olive Oil': 'oliveoil.webp', 'Coconut Oil': 'coconutoil.webp'
}
const productImage = (name, tags, id) => productImageFiles[name] ? `/images/products/${productImageFiles[name]}` : productImageFallback(tags, id)

const groups = [
  ['Grains', [['Wheat Atta', 'wheat flour'], ['Multigrain Atta', 'multigrain flour'], ['Brown Rice', 'brown rice'], ['White Rice', 'white rice'], ['Basmati Rice', 'basmati rice'], ['Sona Masoori Rice', 'sona masoori rice'], ['Quinoa', 'quinoa'], ['Oats', 'rolled oats'], ['Poha', 'flattened rice poha'], ['Ragi Flour', 'ragi flour'], ['Jowar Flour', 'jowar flour'], ['Bajra Flour', 'bajra flour'], ['Maida', 'all purpose flour'], ['Suji/Rava', 'semolina rava'], ['Corn Flour', 'corn flour']]],
  ['Pulses', [['Toor Dal', 'toor dal'], ['Moong Dal', 'moong dal'], ['Masoor Dal', 'masoor dal'], ['Chana Dal', 'chana dal'], ['Urad Dal', 'urad dal'], ['Moong Whole', 'whole green moong'], ['Green Gram', 'green gram'], ['Rajma', 'red kidney beans rajma'], ['Kabuli Chana', 'kabuli chana chickpeas'], ['Black Chana', 'black chickpeas kala chana'], ['Lobia', 'lobia black eyed peas'], ['Soybeans', 'soybeans']]],
  ['Dairy', [['Milk', 'milk glass'], ['Toned Milk', 'toned milk'], ['Full Cream Milk', 'full cream milk'], ['Curd', 'curd yogurt'], ['Greek Yogurt', 'greek yogurt'], ['Buttermilk', 'buttermilk'], ['Paneer', 'fresh paneer'], ['Cheese', 'cheese'], ['Soy Milk', 'soy milk'], ['Almond Milk', 'almond milk']]],
  ['Nuts & Seeds', [['Almonds', 'almonds'], ['Cashews', 'cashews'], ['Walnuts', 'walnuts'], ['Pistachios', 'pistachios'], ['Peanuts', 'peanuts'], ['Raisins', 'raisins'], ['Dates', 'dates'], ['Chia Seeds', 'chia seeds'], ['Flax Seeds', 'flax seeds'], ['Pumpkin Seeds', 'pumpkin seeds']]],
  ['Fruits', [['Apple', 'red apple'], ['Banana', 'banana'], ['Orange', 'orange fruit'], ['Mango', 'ripe mango'], ['Pomegranate', 'pomegranate'], ['Papaya', 'papaya fruit'], ['Guava', 'guava fruit'], ['Watermelon', 'watermelon'], ['Grapes', 'grapes'], ['Pineapple', 'pineapple'], ['Pear', 'pear fruit'], ['Kiwi', 'kiwi fruit']]],
  ['Vegetables', [['Potato', 'potato'], ['Tomato', 'tomato'], ['Onion', 'red onion'], ['Carrot', 'carrot'], ['Spinach', 'spinach'], ['Broccoli', 'broccoli'], ['Cauliflower', 'cauliflower'], ['Cabbage', 'cabbage'], ['Beetroot', 'beetroot'], ['Cucumber', 'cucumber'], ['Capsicum', 'green capsicum bell pepper'], ['Green Peas', 'green peas']]],
  ['Breakfast Foods', [['Brown Bread', 'brown bread'], ['White Bread', 'white bread'], ['Multigrain Bread', 'multigrain bread'], ['Corn Flakes', 'corn flakes cereal'], ['Muesli', 'muesli cereal'], ['Granola', 'granola'], ['Peanut Butter', 'peanut butter'], ['Almond Butter', 'almond butter'], ['Biscuits', 'biscuits'], ['Digestive Biscuits', 'digestive biscuits'], ['Tomato Ketchup', 'tomato ketchup'], ['Instant Noodles', 'instant noodles'], ['Pasta', 'pasta'], ['Vermicelli', 'vermicelli'], ['Ready-to-Eat Poha', 'prepared poha']]],
  ['Beverages', [['Coconut Water', 'coconut water'], ['Fruit Juice', 'fruit juice'], ['Green Tea', 'green tea'], ['Black Tea', 'black tea'], ['Coffee', 'coffee'], ['Health Drink Powder', 'health drink powder'], ['Soy Chunks', 'soy chunks'], ['Tofu', 'tofu'], ['Honey', 'honey'], ['Jaggery', 'jaggery'], ['Sugar', 'white sugar'], ['Cooking Oil', 'cooking oil'], ['Olive Oil', 'olive oil'], ['Coconut Oil', 'coconut oil']]]
]
// Per-100 g nutrition values from standard food-composition references (values for
// prepared beverages are per 100 ml). They are deliberately stored per product,
// rather than copied from a category-wide placeholder.
const nutritionByProduct = {
  'Wheat Atta':[340,13.2,72,2.5,10.7,0.4,0.4,5],'Multigrain Atta':[345,12,68,3.5,11,0.6,1,8],'Brown Rice':[370,7.9,77,2.9,3.5,0.6,0.7,7],'White Rice':[365,7.1,80,0.7,1.3,0.2,0.1,5],'Basmati Rice':[351,8.5,78,0.8,1,0.2,0.1,5],'Sona Masoori Rice':[356,7.5,79,0.6,1.3,0.2,0.1,5],'Quinoa':[368,14.1,64.2,6.1,7,0.7,4.6,5],'Oats':[389,16.9,66.3,6.9,10.6,1.2,1,2],'Poha':[350,6.7,77,1.1,1,0.2,0.2,5],'Ragi Flour':[336,7.3,72,1.3,11.5,0.3,1.5,11],'Jowar Flour':[329,10.4,72.6,3.1,6.7,0.7,2.5,6],'Bajra Flour':[361,11.6,67.5,5,11.5,0.8,1.7,5],'Maida':[364,10.3,76.3,1,2.7,0.2,0.3,2],'Suji/Rava':[360,12.7,72.8,1.1,3.9,0.2,0.4,1],'Corn Flour':[361,6.9,76.9,3.9,7.3,0.5,0.6,5],
  'Toor Dal':[343,22.3,62.8,1.7,15,0.3,2.3,17],'Moong Dal':[347,24.5,59.9,1.2,16.3,0.3,2.1,15],'Masoor Dal':[353,25.8,60.1,1.1,10.7,0.2,2,6],'Chana Dal':[364,20.8,60.9,5.6,17.4,0.6,10.7,24],'Urad Dal':[341,25.2,59.6,1.6,18.3,0.4,2.5,38],'Moong Whole':[347,23.9,62.6,1.2,16.3,0.3,6.6,15],'Green Gram':[347,23.9,62.6,1.2,16.3,0.3,6.6,15],'Rajma':[333,23.6,60,0.8,24.9,0.2,2.1,24],'Kabuli Chana':[364,19.3,60.7,6,17.4,0.6,10.7,24],'Black Chana':[372,20.5,61.5,6.1,17,0.6,10.8,24],'Lobia':[336,23.5,60,1.3,10.6,0.3,6.9,16],'Soybeans':[446,36.5,30.2,19.9,9.3,2.9,7.3,2],
  'Milk':[61,3.2,4.8,3.3,0,2.1,5.1,43],'Toned Milk':[58,3.1,4.8,3,0,1.9,5,43],'Full Cream Milk':[89,3.2,4.9,6.1,0,3.8,5,43],'Curd':[61,3.5,4.7,3.3,0,2.1,4.7,46],'Greek Yogurt':[97,9,3.9,5,0,3.2,3.2,35],'Buttermilk':[40,3.3,4.8,0.9,0,0.6,4.8,105],'Paneer':[265,18.3,1.2,20.8,0,13.2,1.2,22],'Cheese':[402,25,1.3,33.1,0,21.1,0.5,621],'Soy Milk':[43,3.3,2.9,2.1,0.6,0.2,2.5,51],'Almond Milk':[15,0.6,0.3,1.1,0.3,0.1,0.2,63],
  'Almonds':[579,21.2,21.6,49.9,12.5,3.8,4.4,1],'Cashews':[553,18.2,30.2,43.9,3.3,7.8,5.9,12],'Walnuts':[654,15.2,13.7,65.2,6.7,6.1,2.6,2],'Pistachios':[560,20.2,27.2,45.3,10.6,5.6,7.7,1],'Peanuts':[567,25.8,16.1,49.2,8.5,6.3,4.7,18],'Raisins':[299,3.1,79.2,0.5,3.7,0.1,59.2,11],'Dates':[277,1.8,75,0.2,6.7,0,66.5,1],'Chia Seeds':[486,16.5,42.1,30.7,34.4,3.3,0,16],'Flax Seeds':[534,18.3,28.9,42.2,27.3,3.7,1.6,30],'Pumpkin Seeds':[559,30.2,10.7,49,6,8.7,1.4,7],
  'Apple':[52,0.3,13.8,0.2,2.4,0,10.4,1],'Banana':[89,1.1,22.8,0.3,2.6,0.1,12.2,1],'Orange':[47,0.9,11.8,0.1,2.4,0,9.4,0],'Mango':[60,0.8,15,0.4,1.6,0.1,13.7,1],'Pomegranate':[83,1.7,18.7,1.2,4,0.1,13.7,3],'Papaya':[43,0.5,10.8,0.3,1.7,0.1,7.8,8],'Guava':[68,2.6,14.3,1,5.4,0.3,8.9,2],'Watermelon':[30,0.6,7.6,0.2,0.4,0,6.2,1],'Grapes':[69,0.7,18.1,0.2,0.9,0.1,15.5,2],'Pineapple':[50,0.5,13.1,0.1,1.4,0,9.9,1],'Pear':[57,0.4,15.2,0.1,3.1,0,9.8,1],'Kiwi':[61,1.1,14.7,0.5,3,0.1,9,3],
  'Potato':[77,2,17.5,0.1,2.2,0,0.8,6],'Tomato':[18,0.9,3.9,0.2,1.2,0,2.6,5],'Onion':[40,1.1,9.3,0.1,1.7,0,4.2,4],'Carrot':[41,0.9,9.6,0.2,2.8,0,4.7,69],'Spinach':[23,2.9,3.6,0.4,2.2,0.1,0.4,79],'Broccoli':[34,2.8,6.6,0.4,2.6,0,1.7,33],'Cauliflower':[25,1.9,5,0.3,2,0.1,1.9,30],'Cabbage':[25,1.3,5.8,0.1,2.5,0,3.2,18],'Beetroot':[43,1.6,9.6,0.2,2.8,0,6.8,78],'Cucumber':[15,0.7,3.6,0.1,0.5,0,1.7,2],'Capsicum':[20,0.9,4.6,0.2,1.7,0,2.4,3],'Green Peas':[81,5.4,14.5,0.4,5.1,0.1,5.7,5],
  'Brown Bread':[247,13,41,4.2,7,0.8,5,400],'White Bread':[266,8.9,49.4,3.3,2.7,0.7,5,491],'Multigrain Bread':[252,11.5,43,4.5,7.5,0.8,4.5,390],'Corn Flakes':[357,7.5,84,0.4,3.3,0.1,8,729],'Muesli':[378,10,66,7,8,1.2,20,120],'Granola':[471,10,64,20,7,3,24,290],'Peanut Butter':[588,25,20,50,6,10,9,221],'Almond Butter':[614,21,19,56,10,4.5,4,7],'Biscuits':[443,6.7,72,15,2.5,6.8,20,500],'Digestive Biscuits':[480,7,65,20,7,8,17,450],'Tomato Ketchup':[112,1.3,26,0.2,0.3,0,22,907],'Instant Noodles':[436,9,62,17,3,3,3,1500],'Pasta':[371,13,75,1.5,3.2,0.3,2.7,6],'Vermicelli':[351,12,72,1.4,3.9,0.3,1,5],'Ready-to-Eat Poha':[158,3.3,28,3.5,2.5,0.6,1.5,280],
  'Coconut Water':[19,0.7,3.7,0.2,1.1,0.2,2.6,105],'Fruit Juice':[45,0.7,10.4,0.1,0.2,0,8.4,4],'Green Tea':[1,0.2,0,0,0,0,0,1],'Black Tea':[1,0,0.3,0,0,0,0,3],'Coffee':[1,0.1,0,0,0,0,0,2],'Health Drink Powder':[385,8,78,6,3,2,35,180],'Soy Chunks':[345,52,33,0.5,13,0.1,7,15],'Tofu':[76,8,1.9,4.8,0.3,0.7,0.6,7],'Honey':[304,0.3,82.4,0,0.2,0,82.1,4],'Jaggery':[383,0.4,98,0.1,0,0,97,30],'Sugar':[387,0,100,0,0,0,100,1],'Cooking Oil':[884,0,0,100,0,14,0,0],'Olive Oil':[884,0,0,100,0,13.8,0,2],'Coconut Oil':[862,0,0,100,0,86.5,0,0]
}
const packageOptionsFor = (category, name) => {
  const liquidOptions = [{ id: '200ml', label: '200 ml', amount: 200, unit: 'ml', factor: 0.7 }, { id: '500ml', label: '500 ml', amount: 500, unit: 'ml', factor: 1.5 }, { id: '1l', label: '1 litre', amount: 1, unit: 'litre', pluralUnit: 'litres', factor: 2.75 }]
  const dryBeverages = ['Health Drink Powder', 'Soy Chunks', 'Sugar', 'Jaggery']
  if ((category === 'Beverages' && !dryBeverages.includes(name)) || (category === 'Dairy' && !['Paneer', 'Cheese'].includes(name))) return liquidOptions
  if (category === 'Dairy') return [{ id: '200g', label: '200 g', amount: 200, unit: 'g', factor: 0.8 }, { id: '500g', label: '500 g', amount: 500, unit: 'g', factor: 1.8 }, { id: '1kg', label: '1 kg', amount: 1, unit: 'kg', factor: 3.4 }]
  return [{ id: '100g', label: '100 g', amount: 100, unit: 'g', factor: 1 }, { id: '500g', label: '500 g', amount: 500, unit: 'g', factor: 4.6 }, { id: '1kg', label: '1 kg', amount: 1, unit: 'kg', factor: 8.8 }, { id: '2kg', label: '2 kg', amount: 2, unit: 'kg', factor: 17 }, { id: '5kg', label: '5 kg', amount: 5, unit: 'kg', factor: 41 }]
}
const products = groups.flatMap(([category, items], categoryIndex) => items.map(([name, imageTags], itemIndex) => {
  const id = categoryIndex * 20 + itemIndex + 1
  const packageOptions = packageOptionsFor(category, name)
  const [calories, protein, carbs, fat, fiber, saturatedFat, sugar, sodium] = nutritionByProduct[name]
  return { id, name, category, image: productImage(name, imageTags, id), brand: 'Nutrition Library', serving: packageOptions[0].label, packageOptions, calories, protein, carbs, fat, fiber, saturatedFat, sugar, sodium, retailers: [{ price: 1 }] }
}))
const categories = ['All items', 'Grains', 'Pulses', 'Dairy', 'Nuts & Seeds', 'Fruits', 'Vegetables', 'Breakfast Foods', 'Beverages']
const retailerNames = ['BigBasket', 'Blinkit', 'Zepto', 'Swiggy Instamart', 'JioMart', 'Amazon Fresh', 'Flipkart Minutes']
const retailerMultipliers = [1, 1.06, 0.97, 1.03, 1.08, 1.02, 1.04]
// Spread retailer promotions by product name instead of catalog position. This
// prevents a run of products (or a user's usual staples) from repeatedly
// favouring one marketplace simply because of their numeric IDs.
const promotedRetailerIndex = (product) => {
  let hash = 0
  for (const character of `${product.category}:${product.name}`) hash = (hash * 31 + character.charCodeAt(0)) >>> 0
  return hash % retailerNames.length
}
const catalog = products.map((product) => {
  const basePrice = product.category === 'Nuts & Seeds' ? 24 + (product.id % 5) * 7 : product.category === 'Fruits' || product.category === 'Vegetables' ? 5 + (product.id % 5) * 2 : product.category === 'Dairy' || product.category === 'Beverages' ? 12 + (product.id % 5) * 4 : 12 + (product.id % 6) * 4
  const recommendedIndex = promotedRetailerIndex(product)
  return { ...product, retailers: retailerNames.map((name, index) => {
    const estimatedPrice = /\bOil\b/.test(product.name)
      ? basePrice * (index === recommendedIndex ? 0.92 : retailerMultipliers[index])
      : basePrice * (index === recommendedIndex ? 0.9 : retailerMultipliers[index])
    return { name, price: product.id % 3 === 0 ? Math.round(estimatedPrice) : Number(estimatedPrice.toFixed(2)) }
  }) }
})
const formatINR = (value) => `Rs. ${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
const SMART_CART_STORAGE_KEY = 'nutrimatrix-smart-cart'
const packageFor = (product, packageId) => product.packageOptions.find((option) => option.id === packageId) || product.packageOptions[0]
const cartItemKey = (id, packageId) => `${id}-${packageId}`
const priceForPackage = (product, retailer, packageId) => retailer.price * packageFor(product, packageId).factor
const totalPackageLabel = (product, packageId, quantity) => { const option = packageFor(product, packageId); const amount = option.amount * quantity; return `${amount} ${amount === 1 ? option.unit : option.pluralUnit || option.unit}` }

function QuantityStepper({ product, packageId, quantity, onChange, className = 'quantity' }) {
  return <div className={className} aria-label={`${product.name} quantity`}>
    <button type="button" onClick={() => onChange(product.id, packageId, -1)} aria-label={`Remove one ${product.name}`}>−</button>
    <span aria-live="polite">{quantity}</span>
    <button type="button" onClick={() => onChange(product.id, packageId, 1)} aria-label={`Add one ${product.name}`}>+</button>
  </div>
}

function PackageSelect({ product, value, onChange }) {
  const [open, setOpen] = useState(false)
  const selected = packageFor(product, value)
  return <div className="package-picker"><button type="button" className="package-select" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((current) => !current)}>{selected.label} — {formatINR(priceForPackage(product, product.retailers[0], selected.id))}<span aria-hidden="true">⌄</span></button>{open && <div className="package-menu" role="listbox">{product.packageOptions.map((option) => <button type="button" role="option" aria-selected={option.id === selected.id} key={option.id} onClick={() => { onChange(option.id); setOpen(false) }}>{option.label} — {formatINR(priceForPackage(product, product.retailers[0], option.id))}</button>)}</div>}</div>
}

function loadSavedCart() {
  try {
    const savedCart = JSON.parse(localStorage.getItem(SMART_CART_STORAGE_KEY) || '[]')
    if (!Array.isArray(savedCart)) return []
    return savedCart.filter((item) => Number.isInteger(item.id) && item.quantity > 0).reduce((items, item) => {
      const product = catalog.find((entry) => entry.id === item.id)
      if (!product) return items
      const packageId = packageFor(product, item.packageId).id
      const existing = items.find((entry) => entry.id === item.id && entry.packageId === packageId)
      return existing ? items.map((entry) => entry === existing ? { ...entry, quantity: entry.quantity + item.quantity } : entry) : [...items, { id: item.id, packageId, quantity: item.quantity }]
    }, [])
  } catch { return [] }
}

const nutritionDetails = (product) => ({
  calories: product.calories, protein: product.protein, carbohydrates: product.carbs,
  totalFat: product.fat, saturatedFat: product.saturatedFat,
  fibre: product.fiber, sugar: product.sugar, sodium: product.sodium
})
const productHighlights = (facts) => [
  ['High Protein', facts.protein >= 12], ['High Fibre', facts.fibre >= 5],
  ['Low Sugar', facts.sugar <= 5], ['Low Fat', facts.totalFat <= 3],
  ['Moderate Calories', facts.calories >= 100 && facts.calories <= 250]
].filter(([, applies]) => applies).map(([label]) => label)

function ProductAnalysis({ product, alternatives, onBack, onAdd, onChangeQuantity, quantity, packageId, onChangePackage, onSelect }) {
  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: 'auto' }) }, [product.id])
  const facts = nutritionDetails(product)
  const highlights = productHighlights(facts)
  const summaryParts = []
  if (facts.protein >= 12) summaryParts.push('a good amount of protein')
  if (facts.fibre >= 5) summaryParts.push('fibre')
  if (facts.sugar <= 5) summaryParts.push('low sugar')
  if (facts.totalFat <= 3) summaryParts.push('low fat')
  const summary = summaryParts.length ? `This product provides ${summaryParts.join(' and ')} based on its listed nutrition values.` : 'This product has a balanced mix of nutrients based on its listed nutrition values.'
  return <div className="products-page"><Navbar /><main className="products-main analysis-main"><button className="analysis-back" onClick={onBack}>Back to products</button>
  <section className="analysis-hero"><img src={product.image} alt={product.name} /><div><p className="eyebrow">{product.category}</p><h1>{product.name}</h1><p>{product.description || `${product.name} from the NutriMatrix nutrition library.`}</p>
  <label className="analysis-package-label">Pack size<PackageSelect product={product} value={packageId} onChange={(nextPackageId) => onChangePackage(product, nextPackageId)} /></label>{quantity ? <div className="analysis-quantity" aria-label={`${product.name} quantity`}>
    <button onClick={() => onChangeQuantity(product.id, packageId, -1)} aria-label={`Remove one ${product.name}`}>−</button><span>{quantity} ({totalPackageLabel(product, packageId, quantity)})</span><button onClick={() => onChangeQuantity(product.id, packageId, 1)} aria-label={`Add one ${product.name}`}>+</button></div> : <button className="add-button" onClick={() => onAdd(product, packageId)}>Add to SmartCart</button>}</div></section>
    <section className="analysis-block"><h2>Nutrition facts</h2><p className="nutrition-basis">Values shown per 100 g (per 100 ml for drinks); each product has its own food-composition entry.</p><div className="analysis-facts">{Object.entries(facts).map(([key, value]) => <div key={key}><span>{key.replace(/([A-Z])/g, ' $1')}</span><strong>{value}{key === 'calories' ? ' kcal' : key === 'sodium' ? ' mg' : ' g'}</strong><i><b style={{ width: `${Math.min(Number(value) / (key === 'calories' ? 600 : key === 'sodium' ? 500 : 40) * 100, 100)}%` }} /></i></div>)}</div></section><section className="analysis-block"><h2>AI nutrition summary</h2><p className="ai-summary">{summary}</p></section><section className="analysis-block"><h2>Nutrition highlights</h2>
  <div className="highlight-list">{highlights.length ? highlights.map((item) => <span key={item}>{item}</span>) : <p>No qualifying highlights for the listed values.</p>}</div></section><section className="analysis-block"><h2>Healthier alternatives</h2><div className="alternative-list">{alternatives.map((item) => <article key={item.id}>
    <img src={item.image} alt={item.name} /><div><strong>{item.name}</strong><small>{item.calories} kcal - {item.protein}g protein - {item.fiber}g fibre</small>
    <button onClick={() => onSelect(item)}>View Analysis</button></div></article>)}</div></section></main></div>
}

function Products() {
  const [category, setCategory] = useState('All items')
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState(loadSavedCart)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [packageSelections, setPackageSelections] = useState({})
  const cartProducts = cart.map((item) => {
    const product = catalog.find((entry) => entry.id === item.id)
    return product ? { ...product, quantity: item.quantity, packageId: packageFor(product, item.packageId).id } : null
  }).filter(Boolean)
  const visibleProducts = catalog.filter((product) => (category === 'All items' || product.category === category) && (!search.trim() || `${product.name} ${product.brand}`.toLowerCase().includes(search.trim().toLowerCase())))
  const nutrition = useMemo(() => cartProducts.reduce((totals, product) => { const factor = packageFor(product, product.packageId).factor; Object.keys(totals).forEach((key) => { totals[key] += product[key] * product.quantity * factor }); return totals }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }), [cartProducts])
  const retailerTotals = retailerNames.map((name) => ({ name, total: cartProducts.reduce((sum, product) => sum + priceForPackage(product, product.retailers.find((retailer) => retailer.name === name), product.packageId) * product.quantity, 0) }))
  const cheapestTotal = Math.min(...retailerTotals.map((retailer) => retailer.total))
  const highestTotal = Math.max(...retailerTotals.map((retailer) => retailer.total))
  const recommendedRetailer = retailerTotals.find((retailer) => retailer.total === cheapestTotal)?.name
  const addToCart = (product, packageId = product.packageOptions[0].id) => setCart((current) => current.some((item) => item.id === product.id && item.packageId === packageId) ? current.map((item) => item.id === product.id && item.packageId === packageId ? { ...item, quantity: item.quantity + 1 } : item) : [...current, { id: product.id, packageId, quantity: 1 }])
  const changeQuantity = (id, packageId, delta) => setCart((current) => current.map((item) => item.id === id && item.packageId === packageId ? { ...item, quantity: item.quantity + delta } : item).filter((item) => item.quantity > 0))
  //const removeFromCart = (id, packageId) => setCart((current) => current.filter((item) => item.id !== id || item.packageId !== packageId))
  const changePackage = (product, packageId) => setPackageSelections((current) => ({ ...current, [product.id]: packageId }))
  useEffect(() => { localStorage.setItem(SMART_CART_STORAGE_KEY, JSON.stringify(cart)) }, [cart])
  if (selectedProduct) { const selectedPackageId = packageSelections[selectedProduct.id] || selectedProduct.packageOptions[0].id; return <ProductAnalysis product={selectedProduct} alternatives={catalog.filter((product) => product.category === selectedProduct.category && product.id !== selectedProduct.id).slice(0, 4)} onBack={() => setSelectedProduct(null)} onAdd={addToCart} onChangeQuantity={changeQuantity} quantity={cart.find((item) => item.id === selectedProduct.id && item.packageId === selectedPackageId)?.quantity} packageId={selectedPackageId} onChangePackage={changePackage} onSelect={setSelectedProduct} /> }
  return <div className="products-page"><Navbar />
  <main className="products-main">
    <section className="products-intro">
      <div><p className="eyebrow">PRODUCT ANALYSIS LIBRARY <span> | </span> {products.length} PRODUCTS</p>
      <h1>Understand your basket.</h1>
      <p className="intro-copy">Browse food products, add items for nutrition analysis, and compare their estimated prices across Indian retailers.</p></div>
      <div className="basket-note"><span className="basket-icon">Cart</span>
      <strong>{cart.reduce((sum, item) => sum + item.quantity, 0)}</strong>
      <small>items in basket</small></div></section>
      <div className="shop-layout">
        <section className="catalog-section">
          <div className="catalog-toolbar">
            <div className="category-tabs">{categories.map((item) => <button key={item} className={category === item ? 'selected' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div>
            <label className="search-box"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products" /></label></div>
            <div className="product-grid">{visibleProducts.map((product) => {
              // A product can be in the cart in any pack size. Prefer that pack
              // on first render so its card always shows quantity controls.
              const cartItem = cart.find((item) => item.id === product.id)
              const selectedPackageId = packageSelections[product.id] || cartItem?.packageId || product.packageOptions[0].id
              const activeCartItem = cart.find((item) => item.id === product.id && item.packageId === selectedPackageId) || cartItem
              const quantity = activeCartItem?.quantity || 0
              return <article className="product-card" key={product.id}>
              <div className="product-art"><img src={product.image} alt={product.name} loading="lazy" /><small>{product.category}</small></div>
              <div className="product-body"><p className="product-brand">{product.brand}</p>
              <div className="product-name-row"><h2>{product.name}</h2>
              <strong className="product-price">{formatINR(priceForPackage(product, product.retailers[0], selectedPackageId))}</strong></div>
              <div className="serving"><PackageSelect product={product} value={selectedPackageId} onChange={(nextPackageId) => changePackage(product, nextPackageId)} /></div>
              <div className="product-bottom"><button className="add-button" onClick={() => setSelectedProduct(product)}>View Analysis</button>{quantity > 0 ? <QuantityStepper product={product} packageId={activeCartItem.packageId} quantity={quantity} onChange={changeQuantity} className="card-quantity" /> : <button className="add-button" onClick={() => addToCart(product, selectedPackageId)}>Add to Cart</button>}</div></div></article>
            })}</div></section>
                <aside className="basket-panel"><div className="panel-heading"><div>
                  <p className="eyebrow">YOUR BASKET</p><h2>Nutrition & value</h2></div>{cart.length > 0 && <button className="clear-button" onClick={() => setCart([])}>Clear</button>}</div>{cartProducts.length === 0 ? <div className="empty-basket"><span>Empty</span><h3>Your analysis list is empty</h3>
                  <p>Add products to see a live nutrition summary and compare estimated prices across Indian retailers.</p></div> : <><div className="basket-items">{cartProducts.map((product) => <div className="basket-item" key={cartItemKey(product.id, product.packageId)}>
                    <img className="mini-art" src={product.image} alt="" /><div className="basket-item-info"><strong>{product.name}</strong><small>{product.quantity} qty · {totalPackageLabel(product, product.packageId, product.quantity)}</small><span className="basket-item-price">{product.quantity === 1 ? formatINR(priceForPackage(product, product.retailers[0], product.packageId)) : `${formatINR(priceForPackage(product, product.retailers[0], product.packageId))} each · ${formatINR(priceForPackage(product, product.retailers[0], product.packageId) * product.quantity)}`}</span></div>
                    <QuantityStepper product={product} packageId={product.packageId} quantity={product.quantity} onChange={changeQuantity} /></div>)}</div>
                    <div className="nutrition-box"><div className="summary-title"><h3>Basket nutrition</h3><span>total serving size</span></div>
                    <div className="calorie-row"><strong>{Number(nutrition.calories).toFixed(2)}</strong><span>kcal</span>
                    <div className="calorie-bar"><i style={{ width: `${Math.min(nutrition.calories / 20, 100)}%` }} /></div></div>
                    <div className="macro-grid"><div><strong>{Number(nutrition.protein).toFixed(2)}g</strong><span>Protein</span></div>
                    <div><strong>{Number(nutrition.carbs).toFixed(2)}g</strong><span>Carbs</span></div>
                    <div><strong>{Number(nutrition.fat).toFixed(2)}g</strong><span>Fat</span></div><div><strong>{Number(nutrition.fiber).toFixed(2)}g</strong><span>Fiber</span></div></div></div>
                    <div className="price-box"><div className="summary-title"><h3>Indian price comparison</h3><span>Across 7 platforms</span></div>
                    <div className="price-total"><strong>{formatINR(cheapestTotal)}</strong><span>Recommended total</span><small><b>Original / highest total: {formatINR(highestTotal)}</b></small><span>Save {formatINR(Math.max(highestTotal - cheapestTotal, 0))} vs highest total</span></div>
                    <div className="retailer-list">{retailerTotals.map((retailer) => <div key={retailer.name}><span className={retailer.name === recommendedRetailer ? 'recommended-dot' : ''}>{retailer.name}{retailer.name === recommendedRetailer && <em>Recommended</em>}</span>
                    <strong>{formatINR(retailer.total)}</strong></div>)}</div></div><p className="analysis-note">Prices are comparison estimates from listed retailers. NutriMatrix does not sell or process orders.</p></>}</aside></div></main></div>
}
export default Products
