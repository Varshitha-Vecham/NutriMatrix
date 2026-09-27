import { useMemo, useState } from 'react'
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
const nutritionByCategory = {
  Grains: { calories: 150, protein: 4, carbs: 31, fat: 2, fiber: 3 }, Pulses: { calories: 170, protein: 12, carbs: 29, fat: 1, fiber: 8 },
  Dairy: { calories: 120, protein: 7, carbs: 9, fat: 6, fiber: 0 }, 'Nuts & Seeds': { calories: 170, protein: 6, carbs: 7, fat: 15, fiber: 3 },
  Fruits: { calories: 75, protein: 1, carbs: 19, fat: 0, fiber: 3 }, Vegetables: { calories: 35, protein: 2, carbs: 7, fat: 0, fiber: 3 },
  'Breakfast Foods': { calories: 145, protein: 4, carbs: 23, fat: 5, fiber: 3 }, Beverages: { calories: 50, protein: 1, carbs: 10, fat: 1, fiber: 1 }
}
const products = groups.flatMap(([category, items], categoryIndex) => items.map(([name, imageTags], itemIndex) => {
  const id = categoryIndex * 20 + itemIndex + 1
  return { id, name, category, image: productImage(name, imageTags, id), brand: 'Nutrition Library', serving: category === 'Beverages' ? '1 cup serving' : '100g ', ...nutritionByCategory[category], retailers: [{ price: 2.5 + (id % 7) * 0.4 }] }
}))
const categories = ['All items', 'Grains', 'Pulses', 'Dairy', 'Nuts & Seeds', 'Fruits', 'Vegetables', 'Breakfast Foods', 'Beverages']
const retailerNames = ['BigBasket', 'Blinkit', 'Zepto', 'Swiggy Instamart', 'JioMart', 'Amazon Fresh','Filpkart Minutes']
const retailerMultipliers = [1, 1.06, 0.97, 1.03, 1.08, 1.02]
const catalog = products.map((product) => ({ ...product, retailers: retailerNames.map((name, index) => ({ name, price: Math.round(product.retailers[0].price * 85 * retailerMultipliers[index]) })) }))
const formatINR = (value) => `Rs. ${value.toLocaleString('en-IN')}`

const nutritionDetails = (product) => ({
  calories: product.calories, protein: product.protein, carbohydrates: product.carbs,
  totalFat: product.fat, saturatedFat: Number((product.fat * 0.35).toFixed(1)),
  fibre: product.fiber, sugar: Number((product.carbs * 0.12).toFixed(1)), sodium: Math.round(product.calories * 0.45)
})
const productHighlights = (facts) => [
  ['High Protein', facts.protein >= 12], ['High Fibre', facts.fibre >= 5],
  ['Low Sugar', facts.sugar <= 5], ['Low Fat', facts.totalFat <= 3],
  ['Moderate Calories', facts.calories >= 100 && facts.calories <= 250]
].filter(([, applies]) => applies).map(([label]) => label)

function ProductAnalysis({ product, alternatives, onBack, onAdd, onSelect }) {
  const facts = nutritionDetails(product)
  const highlights = productHighlights(facts)
  const summaryParts = []
  if (facts.protein >= 12) summaryParts.push('a good amount of protein')
  if (facts.fibre >= 5) summaryParts.push('fibre')
  if (facts.sugar <= 5) summaryParts.push('low sugar')
  if (facts.totalFat <= 3) summaryParts.push('low fat')
  const summary = summaryParts.length ? `This product provides ${summaryParts.join(' and ')} based on its listed nutrition values.` : 'This product has a balanced mix of nutrients based on its listed nutrition values.'
  return <div className="products-page"><Navbar /><main className="products-main analysis-main"><button className="analysis-back" onClick={onBack}>Back to products</button><section className="analysis-hero"><img src={product.image} alt={product.name} /><div><p className="eyebrow">{product.category}</p><h1>{product.name}</h1><p>{product.description || `${product.name} from the NutriMatrix nutrition library.`}</p><button className="add-button" onClick={() => onAdd(product)}>Add to SmartCart</button></div></section><section className="analysis-block"><h2>Nutrition facts</h2><div className="analysis-facts">{Object.entries(facts).map(([key, value]) => <div key={key}><span>{key.replace(/([A-Z])/g, ' $1')}</span><strong>{value}{key === 'calories' ? ' kcal' : key === 'sodium' ? ' mg' : ' g'}</strong><i><b style={{ width: `${Math.min(Number(value) / (key === 'calories' ? 600 : key === 'sodium' ? 500 : 40) * 100, 100)}%` }} /></i></div>)}</div></section><section className="analysis-block"><h2>AI nutrition summary</h2><p className="ai-summary">{summary}</p></section><section className="analysis-block"><h2>Nutrition highlights</h2><div className="highlight-list">{highlights.length ? highlights.map((item) => <span key={item}>{item}</span>) : <p>No qualifying highlights for the listed values.</p>}</div></section><section className="analysis-block"><h2>Healthier alternatives</h2><div className="alternative-list">{alternatives.map((item) => <article key={item.id}><img src={item.image} alt={item.name} /><div><strong>{item.name}</strong><small>{item.calories} kcal - {item.protein}g protein - {item.fiber}g fibre</small><button onClick={() => onSelect(item)}>View Analysis</button></div></article>)}</div></section></main></div>
}

function Products() {
  const [category, setCategory] = useState('All items')
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const cartProducts = cart.map((item) => ({ ...catalog.find((product) => product.id === item.id), quantity: item.quantity }))
  const visibleProducts = catalog.filter((product) => (category === 'All items' || product.category === category) && (!search.trim() || `${product.name} ${product.brand}`.toLowerCase().includes(search.trim().toLowerCase())))
  const nutrition = useMemo(() => cartProducts.reduce((totals, product) => { Object.keys(totals).forEach((key) => { totals[key] += product[key] * product.quantity }); return totals }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }), [cartProducts])
  const retailerTotals = retailerNames.map((name) => ({ name, total: cartProducts.reduce((sum, product) => sum + product.retailers.find((retailer) => retailer.name === name).price * product.quantity, 0) }))
  const cheapestTotal = Math.min(...retailerTotals.map((retailer) => retailer.total))
  const highestTotal = Math.max(...retailerTotals.map((retailer) => retailer.total))
  const recommendedRetailer = retailerTotals.find((retailer) => retailer.total === cheapestTotal)?.name
  const addToCart = (product) => setCart((current) => current.some((item) => item.id === product.id) ? current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item) : [...current, { id: product.id, quantity: 1 }])
  const changeQuantity = (id, delta) => setCart((current) => current.map((item) => item.id === id ? { ...item, quantity: item.quantity + delta } : item).filter((item) => item.quantity > 0))
  if (selectedProduct) return <ProductAnalysis product={selectedProduct} alternatives={catalog.filter((product) => product.category === selectedProduct.category && product.id !== selectedProduct.id).slice(0, 4)} onBack={() => setSelectedProduct(null)} onAdd={addToCart} onSelect={setSelectedProduct} />
  return <div className="products-page"><Navbar /><main className="products-main"><section className="products-intro"><div><p className="eyebrow">PRODUCT ANALYSIS LIBRARY <span> | </span> {products.length} PRODUCTS</p><h1>Understand your basket.</h1><p className="intro-copy">Browse food products, add items for nutrition analysis, and compare their estimated prices across Indian retailers.</p></div><div className="basket-note"><span className="basket-icon">Cart</span><strong>{cart.reduce((sum, item) => sum + item.quantity, 0)}</strong><small>items in basket</small></div></section><div className="shop-layout"><section className="catalog-section"><div className="catalog-toolbar"><div className="category-tabs">{categories.map((item) => <button key={item} className={category === item ? 'selected' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div><label className="search-box"><span>Search</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products" /></label></div><div className="product-grid">{visibleProducts.map((product) => <article className="product-card" key={product.id}><div className="product-art"><img src={product.image} alt={product.name} loading="lazy" /><small>{product.category}</small></div><div className="product-body"><p className="product-brand">{product.brand}</p><h2>{product.name}</h2><p className="serving">{product.serving} <span>|</span> {product.calories} kcal</p><div className="product-bottom"><button className="add-button" onClick={() => setSelectedProduct(product)}>View Analysis</button><button className="add-button" onClick={() => addToCart(product)}>Add to Cart</button></div></div></article>)}</div></section><aside className="basket-panel"><div className="panel-heading"><div><p className="eyebrow">YOUR BASKET</p><h2>Nutrition & value</h2></div>{cart.length > 0 && <button className="clear-button" onClick={() => setCart([])}>Clear</button>}</div>{cartProducts.length === 0 ? <div className="empty-basket"><span>Empty</span><h3>Your analysis list is empty</h3><p>Add products to see a live nutrition summary and compare estimated prices across Indian retailers.</p></div> : <><div className="basket-items">{cartProducts.map((product) => <div className="basket-item" key={product.id}><img className="mini-art" src={product.image} alt="" /><div className="basket-item-info"><strong>{product.name}</strong><small>{product.serving}</small></div><div className="quantity"><button onClick={() => changeQuantity(product.id, -1)} aria-label={`Remove one ${product.name}`}>Remove</button><span>{product.quantity}</span><button onClick={() => changeQuantity(product.id, 1)} aria-label={`Add one ${product.name}`}>+</button></div></div>)}</div><div className="nutrition-box"><div className="summary-title"><h3>Basket nutrition</h3><span>total serving size</span></div><div className="calorie-row"><strong>{nutrition.calories}</strong><span>kcal</span><div className="calorie-bar"><i style={{ width: `${Math.min(nutrition.calories / 20, 100)}%` }} /></div></div><div className="macro-grid"><div><strong>{nutrition.protein}g</strong><span>Protein</span></div><div><strong>{nutrition.carbs}g</strong><span>Carbs</span></div><div><strong>{nutrition.fat}g</strong><span>Fat</span></div><div><strong>{nutrition.fiber}g</strong><span>Fiber</span></div></div></div><div className="price-box"><div className="summary-title"><h3>Indian price comparison</h3><span>across 6 platforms</span></div><div className="price-total"><strong>{formatINR(cheapestTotal)}</strong><span>Save {formatINR(Math.max(highestTotal - cheapestTotal, 0))} vs highest total</span></div><div className="retailer-list">{retailerTotals.map((retailer) => <div key={retailer.name}><span className={retailer.name === recommendedRetailer ? 'recommended-dot' : ''}>{retailer.name}{retailer.name === recommendedRetailer && <em>Recommended</em>}</span><strong>{formatINR(retailer.total)}</strong></div>)}</div></div><p className="analysis-note">Prices are comparison estimates from listed retailers. NutriMatrix does not sell or process orders.</p></>}</aside></div></main></div>
}
export default Products






