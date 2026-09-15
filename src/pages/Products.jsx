import { useMemo, useState } from 'react'
import Navbar from '../components/Navbar.jsx'
import './Products.css'

const products = [
  { id: 1, name: 'Organic Greek Yogurt', brand: 'Green Valley', category: 'Dairy', image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=700&q=85', serving: '170g cup', calories: 120, protein: 17, carbs: 8, fat: 3, fiber: 0, retailers: [{ name: 'FreshMart', price: 2.49 }, { name: 'Whole Basket', price: 2.79 }, { name: 'DailyCart', price: 2.29 }] },
  { id: 2, name: 'Avocado Hass', brand: 'Nature Pick', category: 'Fruits', image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=700&q=85', serving: '1 medium fruit', calories: 240, protein: 3, carbs: 13, fat: 22, fiber: 10, retailers: [{ name: 'FreshMart', price: 1.19 }, { name: 'Whole Basket', price: 1.49 }, { name: 'DailyCart', price: 0.99 }] },
  { id: 3, name: 'Red Bell Peppers', brand: 'Harvest Field', category: 'Vegetables', image: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=700&q=85', serving: '1 medium pepper', calories: 37, protein: 1, carbs: 7, fat: 0, fiber: 2, retailers: [{ name: 'FreshMart', price: 1.29 }, { name: 'Whole Basket', price: 1.59 }, { name: 'DailyCart', price: 1.09 }] },
  { id: 4, name: 'Wild Blueberries', brand: 'North Farm', category: 'Fruits', image: 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=700&q=85', serving: '1 cup', calories: 84, protein: 1, carbs: 21, fat: 0, fiber: 4, retailers: [{ name: 'FreshMart', price: 3.99 }, { name: 'Whole Basket', price: 3.49 }, { name: 'DailyCart', price: 4.29 }] },
  { id: 5, name: 'Baby Spinach', brand: 'Leaf & Co.', category: 'Vegetables', image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=700&q=85', serving: '85g serving', calories: 20, protein: 2, carbs: 3, fat: 0, fiber: 2, retailers: [{ name: 'FreshMart', price: 2.99 }, { name: 'Whole Basket', price: 2.49 }, { name: 'DailyCart', price: 3.19 }] },
  { id: 6, name: 'Almond Butter', brand: 'Stone Mill', category: 'Pantry', image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=700&q=85', serving: '2 tbsp', calories: 196, protein: 7, carbs: 6, fat: 18, fiber: 4, retailers: [{ name: 'FreshMart', price: 8.49 }, { name: 'Whole Basket', price: 7.99 }, { name: 'DailyCart', price: 8.99 }] },
  { id: 7, name: 'Honeycrisp Apples', brand: 'Orchard House', category: 'Fruits', image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=700&q=85', serving: '1 medium apple', calories: 95, protein: 1, carbs: 25, fat: 0, fiber: 4, retailers: [{ name: 'FreshMart', price: 1.49 }, { name: 'Whole Basket', price: 1.29 }, { name: 'DailyCart', price: 1.69 }] },
  { id: 8, name: 'Cherry Tomatoes', brand: 'Sun Garden', category: 'Vegetables', image: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=700&q=85', serving: '1 cup', calories: 27, protein: 1, carbs: 6, fat: 0, fiber: 2, retailers: [{ name: 'FreshMart', price: 2.79 }, { name: 'Whole Basket', price: 2.99 }, { name: 'DailyCart', price: 2.49 }] },
  { id: 9, name: 'Free-Range Eggs', brand: 'Meadow Rise', category: 'Dairy', image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=700&q=85', serving: '2 large eggs', calories: 143, protein: 13, carbs: 1, fat: 10, fiber: 0, retailers: [{ name: 'FreshMart', price: 4.99 }, { name: 'Whole Basket', price: 5.49 }, { name: 'DailyCart', price: 4.59 }] },
  { id: 10, name: 'Whole Grain Oats', brand: 'Morning Mill', category: 'Grains', image: 'https://images.unsplash.com/photo-1517093728432-a0440f8d45af?w=700&q=85', serving: '40g serving', calories: 150, protein: 5, carbs: 27, fat: 3, fiber: 4, retailers: [{ name: 'FreshMart', price: 4.49 }, { name: 'Whole Basket', price: 3.99 }, { name: 'DailyCart', price: 4.79 }] },
  { id: 11, name: 'Broccoli Crowns', brand: 'Harvest Field', category: 'Vegetables', image: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=700&q=85', serving: '1 cup chopped', calories: 31, protein: 3, carbs: 6, fat: 0, fiber: 2, retailers: [{ name: 'FreshMart', price: 2.49 }, { name: 'Whole Basket', price: 2.29 }, { name: 'DailyCart', price: 2.69 }] },
  { id: 12, name: 'Strawberries', brand: 'Berry Good', category: 'Fruits', image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=700&q=85', serving: '1 cup sliced', calories: 49, protein: 1, carbs: 12, fat: 0, fiber: 3, retailers: [{ name: 'FreshMart', price: 3.49 }, { name: 'Whole Basket', price: 3.99 }, { name: 'DailyCart', price: 2.99 }] },
  { id: 13, name: 'Bananas', brand: 'Tropical Harvest', category: 'Fruits', image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=700&q=85', serving: '1 medium banana', calories: 105, protein: 1, carbs: 27, fat: 0, fiber: 3, retailers: [{ name: 'FreshMart', price: 1.99 }, { name: 'Whole Basket', price: 2.29 }, { name: 'DailyCart', price: 1.79 }] },
  { id: 14, name: 'Fresh Paneer', brand: 'Farmstead', category: 'Dairy', image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=700&q=85', serving: '100g serving', calories: 265, protein: 18, carbs: 6, fat: 20, fiber: 0, retailers: [{ name: 'FreshMart', price: 4.99 }, { name: 'Whole Basket', price: 5.49 }, { name: 'DailyCart', price: 4.59 }] },
  { id: 15, name: 'Toned Milk', brand: 'Daily Dairy', category: 'Dairy', image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=700&q=85', serving: '250ml glass', calories: 120, protein: 8, carbs: 12, fat: 4, fiber: 0, retailers: [{ name: 'FreshMart', price: 1.49 }, { name: 'Whole Basket', price: 1.59 }, { name: 'DailyCart', price: 1.29 }] },
  { id: 16, name: 'Yellow Moong Dal', brand: 'Kitchen Roots', category: 'Pantry', image: 'https://images.unsplash.com/photo-1585997648044-3b9d8b6b8e7f?w=700&q=85', serving: '50g dry serving', calories: 174, protein: 12, carbs: 30, fat: 1, fiber: 8, retailers: [{ name: 'FreshMart', price: 3.49 }, { name: 'Whole Basket', price: 3.19 }, { name: 'DailyCart', price: 3.79 }] }
]

const categories = ['All items', 'Vegetables', 'Fruits', 'Dairy', 'Grains', 'Pantry']
const retailerNames = ['BigBasket', 'Blinkit', 'Zepto', 'Swiggy Instamart', 'JioMart', 'Amazon Fresh']
const retailerMultipliers = [1, 1.06, 0.97, 1.03, 1.08, 1.02]
const catalog = products.map((product) => ({
  ...product,
  retailers: retailerNames.map((name, index) => ({
    name,
    price: Math.round(product.retailers[index % 3].price * 85 * retailerMultipliers[index])
  }))
}))
const formatINR = (value) => `₹${value.toLocaleString('en-IN')}`

function Products() {
  const [category, setCategory] = useState('All items')
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState([])
  const cartProducts = cart.map((item) => ({ ...catalog.find((product) => product.id === item.id), quantity: item.quantity }))
  const visibleProducts = catalog.filter((product) => {
    const matchesCategory = category === 'All items' || product.category === category
    const term = search.trim().toLowerCase()
    return matchesCategory && (!term || `${product.name} ${product.brand}`.toLowerCase().includes(term))
  })
  const nutrition = useMemo(() => cartProducts.reduce((totals, product) => {
    Object.keys(totals).forEach((key) => { totals[key] += product[key] * product.quantity })
    return totals
  }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }), [cartProducts])
     const retailerTotals = retailerNames.map((retailer) => ({
       name: retailer,
       total: cartProducts.reduce((sum, product) => sum + product.retailers.find((item) => item.name === retailer).price * product.quantity, 0)
     }))
     const cheapestTotal = Math.min(...retailerTotals.map((retailer) => retailer.total))
     const highestTotal = Math.max(...retailerTotals.map((retailer) => retailer.total))
     const recommendedRetailer = retailerTotals.find((retailer) => retailer.total === cheapestTotal)?.name

  function addToCart(product) {
    setCart((current) => current.some((item) => item.id === product.id)
      ? current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
      : [...current, { id: product.id, quantity: 1 }])
  }

  function changeQuantity(id, delta) {
    setCart((current) => current.map((item) => item.id === id ? { ...item, quantity: item.quantity + delta } : item).filter((item) => item.quantity > 0))
  }

  return (
    <div className="products-page">
      <Navbar />
      <main className="products-main">
        <section className="products-intro">
          <div><p className="eyebrow">PRODUCT ANALYSIS LIBRARY <span>•</span> 16 PRODUCTS</p><h1>Understand your basket.</h1><p className="intro-copy">Browse real grocery products, add items for nutrition analysis, and compare their estimated prices across Indian retailers.</p></div>
          <div className="basket-note"><span className="basket-icon">🛒</span><strong>{cart.reduce((sum, item) => sum + item.quantity, 0)}</strong><small>items in basket</small></div>
        </section>
        <div className="shop-layout">
          <section className="catalog-section">
            <div className="catalog-toolbar"><div className="category-tabs">{categories.map((item) => <button key={item} className={category === item ? 'selected' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div><label className="search-box"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products" /></label></div>
            <div className="product-grid">{visibleProducts.map((product) => <article className="product-card" key={product.id}><div className="product-art"><img src={product.image} alt={product.name} loading="lazy" /><small>{product.category}</small></div><div className="product-body"><p className="product-brand">{product.brand}</p><h2>{product.name}</h2><p className="serving">{product.serving} <span>•</span> {product.calories} kcal</p><div className="product-bottom"><button className="add-button" onClick={() => addToCart(product)}>Add for analysis <span>+</span></button></div></div></article>)}</div>
          </section>
          <aside className="basket-panel">
            <div className="panel-heading"><div><p className="eyebrow">YOUR BASKET</p><h2>Nutrition & value</h2></div>{cart.length > 0 && <button className="clear-button" onClick={() => setCart([])}>Clear</button>}</div>
            {cartProducts.length === 0 ? <div className="empty-basket"><span>🛒</span><h3>Your analysis list is empty</h3><p>Add products to see a live nutrition summary and compare estimated prices across Indian retailers.</p></div> : <>
              <div className="basket-items">{cartProducts.map((product) => <div className="basket-item" key={product.id}><img className="mini-art" src={product.image} alt="" /><div className="basket-item-info"><strong>{product.name}</strong><small>{product.serving}</small></div><div className="quantity"><button onClick={() => changeQuantity(product.id, -1)} aria-label={`Remove one ${product.name}`}>−</button><span>{product.quantity}</span><button onClick={() => changeQuantity(product.id, 1)} aria-label={`Add one ${product.name}`}>+</button></div></div>)}</div>
              <div className="nutrition-box"><div className="summary-title"><h3>Basket nutrition</h3><span>total serving size</span></div><div className="calorie-row"><strong>{nutrition.calories}</strong><span>kcal</span><div className="calorie-bar"><i style={{ width: `${Math.min(nutrition.calories / 20, 100)}%` }} /></div></div><div className="macro-grid"><div><strong>{nutrition.protein}g</strong><span>Protein</span></div><div><strong>{nutrition.carbs}g</strong><span>Carbs</span></div><div><strong>{nutrition.fat}g</strong><span>Fat</span></div><div><strong>{nutrition.fiber}g</strong><span>Fiber</span></div></div></div>
              <div className="price-box"><div className="summary-title"><h3>Indian price comparison</h3><span>across 6 platforms</span></div><div className="price-total"><strong>{formatINR(cheapestTotal)}</strong><span>Save {formatINR(Math.max(highestTotal - cheapestTotal, 0))} vs highest total</span></div><div className="retailer-list">{retailerTotals.map((retailer) => <div key={retailer.name}><span className={retailer.name === recommendedRetailer ? 'recommended-dot' : ''}>{retailer.name}{retailer.name === recommendedRetailer && <em>Recommended</em>}</span><strong>{formatINR(retailer.total)}</strong></div>)}</div></div>
              <p className="analysis-note">Prices are comparison estimates from listed retailers. NutriMatrix does not sell or process orders.</p>
            </>}
          </aside>
        </div>
      </main>
    </div>
  )
}

export default Products
