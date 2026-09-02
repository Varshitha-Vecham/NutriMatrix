import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import mysql from 'mysql2/promise'

const app = express()
const port = process.env.API_PORT || 3001
const jwtSecret = process.env.JWT_SECRET || 'change-this-secret'
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost', port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'nutrimatrix', waitForConnections: true, connectionLimit: 10
})

const sampleProductCatalog = [
  {
    id: 1,
    name: 'Organic Rolled Oats',
    brand: 'Harvest & Co.',
    category: 'Breakfast cereals',
    barcode: '8901030894567',
    price: 259,
    image: 'https://images.unsplash.com/photo-1517093728432-a0440f8d45af?auto=format&fit=crop&w=900&q=85',
    nutrition: { calories: 389, protein: 13, carbs: 66, fat: 7, fiber: 8 },
    description: 'Whole grain oats with no added sugar, rich in fibre and ideal for a nourishing breakfast.'
  },
  {
    id: 2,
    name: 'Greek Yogurt',
    brand: 'Pure & Plain',
    category: 'Dairy',
    barcode: '8901234567890',
    price: 189,
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=900&q=85',
    nutrition: { calories: 170, protein: 17, carbs: 6, fat: 9, fiber: 0 },
    description: 'Creamy high-protein yogurt with a smooth finish and minimal ingredients.'
  },
  {
    id: 3,
    name: 'Bananas',
    brand: 'Fresh Harvest',
    category: 'Fruits',
    barcode: '8902345678901',
    price: 89,
    image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=900&q=85',
    nutrition: { calories: 105, protein: 1, carbs: 27, fat: 0, fiber: 3 },
    description: 'Naturally sweet fruit packed with potassium and convenient for quick energy.'
  },
  {
    id: 4,
    name: 'Brown Rice',
    brand: 'Sun Valley',
    category: 'Grains',
    barcode: '8903456789012',
    price: 210,
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31e?auto=format&fit=crop&w=900&q=85',
    nutrition: { calories: 216, protein: 5, carbs: 45, fat: 2, fiber: 4 },
    description: 'Whole grain rice that provides slow-release energy and a hearty base for meals.'
  },
  {
    id: 5,
    name: 'Almond Milk',
    brand: 'Green Nature',
    category: 'Beverages',
    barcode: '8904567890123',
    price: 175,
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=900&q=85',
    nutrition: { calories: 30, protein: 1, carbs: 1, fat: 2, fiber: 0 },
    description: 'Unsweetened almond milk with a light texture and a smooth dairy-free option.'
  },
  {
    id: 6,
    name: 'Whole Wheat Bread',
    brand: 'Healthy Loaf',
    category: 'Bakery',
    barcode: '8905678901234',
    price: 149,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=85',
    nutrition: { calories: 165, protein: 8, carbs: 29, fat: 2, fiber: 5 },
    description: 'Soft whole wheat bread made for balanced sandwiches and daily nutrition.'
  }
]

function matchProducts(query) {
  const trimmed = String(query || '').trim().toLowerCase()
  if (!trimmed) return []

  return sampleProductCatalog.filter((product) => {
    const haystack = [product.name, product.brand, product.category, product.description].join(' ').toLowerCase()
    return haystack.includes(trimmed)
  })
}

function buildReceiptProducts(items = []) {
  const receiptItems = (items.length ? items : ['Organic Rolled Oats', 'Bananas', 'Greek Yogurt', 'Brown Rice']).map((item) => String(item).trim()).filter(Boolean)

  return receiptItems.map((item, index) => {
    const matched = matchProducts(item)
    const product = matched[0] || sampleProductCatalog[index % sampleProductCatalog.length]

    return {
      id: `${product.id}-${index}`,
      name: product.name,
      brand: product.brand,
      category: product.category,
      barcode: product.barcode,
      price: product.price,
      image: product.image,
      description: product.description,
      nutrition: product.nutrition,
      expiryDate: null,
      source: 'receipt'
    }
  })
}

async function ensureReceiptProductsTable() {
  await pool.query(`CREATE TABLE IF NOT EXISTS receipt_products (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    receipt_file_name VARCHAR(255) NOT NULL,
    product_name VARCHAR(150) NOT NULL,
    brand VARCHAR(150) NULL,
    barcode VARCHAR(50) NULL,
    expiry_date DATE NULL,
    purchased_at DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_receipt_product_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_receipt_products_user_expiry (user_id, expiry_date)
  )`)
}

function expiryStatus(expiryDate) {
  if (!expiryDate) return 'Unavailable'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(`${String(expiryDate).slice(0, 10)}T00:00:00`)
  const daysRemaining = Math.ceil((expiry - today) / 86400000)
  return { daysRemaining, status: daysRemaining < 0 ? 'Expired' : daysRemaining <= 3 ? 'Expiring Soon' : 'Fresh / Safe' }
}

async function ensureProfileColumns() {
  const [columns] = await pool.query('SHOW COLUMNS FROM nutrition_profiles')
  const existingColumns = new Set(columns.map((column) => column.Field))
  const requiredColumns = {
    phone: 'VARCHAR(30) NULL',
    age: 'TINYINT UNSIGNED NULL',
    gender: "VARCHAR(30) NOT NULL DEFAULT 'prefer not to say'",
    height_cm: 'DECIMAL(5, 1) NULL',
    weight_kg: 'DECIMAL(5, 1) NULL',
    dietary_goal: "VARCHAR(50) NOT NULL DEFAULT 'healthy eating'",
    diet_type: "VARCHAR(50) NOT NULL DEFAULT 'no preference'",
    allergies: 'TEXT NULL',
    food_dislikes: 'TEXT NULL',
    cuisines: 'TEXT NULL',
    monthly_budget: 'DECIMAL(10, 2) NULL',
    price_conscious: 'BOOLEAN NOT NULL DEFAULT TRUE',
    notifications: 'BOOLEAN NOT NULL DEFAULT TRUE',
    expiry_reminders: 'BOOLEAN NOT NULL DEFAULT TRUE',
    ai_recommendations: 'BOOLEAN NOT NULL DEFAULT TRUE'
  }

  for (const [columnName, definition] of Object.entries(requiredColumns)) {
    if (!existingColumns.has(columnName)) {
      await pool.query(`ALTER TABLE nutrition_profiles ADD COLUMN ${columnName} ${definition}`)
    }
  }
}

async function ensureAdminAccess() {
  const [columns] = await pool.query('SHOW COLUMNS FROM users')
  if (!columns.some((column) => column.Field === 'role')) {
    await pool.query("ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'user'")
  }

  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminEmail || !adminPassword) return

  const [users] = await pool.execute('SELECT id FROM users WHERE email = ?', [adminEmail])
  if (users.length) {
    await pool.execute("UPDATE users SET role = 'admin' WHERE email = ?", [adminEmail])
    return
  }

  await pool.execute('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', [
    'NutriMatrix Admin', adminEmail, await bcrypt.hash(adminPassword, 12), 'admin'
  ])
}

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }))
app.use(express.json())
app.use(cookieParser())

function setAuthCookie(res, user) {
  const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role || 'user' }, jwtSecret, { expiresIn: '7d' })
  res.cookie('nutrimatrix_token', token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 604800000 })
}

function requireAuth(req, res, next) {
  try {
    req.user = jwt.verify(req.cookies.nutrimatrix_token, jwtSecret)
    next()
  } catch { res.status(401).json({ message: 'Not authenticated.' }) }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required.' })
  next()
}

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body
  if (!name || !email || !password) return res.status(400).json({ message: 'All fields are required.' })
  try {
    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email])
    if (existing.length) return res.status(409).json({ message: 'An account with this email already exists.' })
    await pool.execute('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)', [name, email, await bcrypt.hash(password, 12)])
    res.status(201).json({ message: 'Account created successfully.' })
  } catch (error) { console.error(error); res.status(500).json({ message: 'Unable to create account.' }) }
})

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body
  try {
    const [users] = await pool.execute('SELECT id, name, email, password_hash, role FROM users WHERE email = ?', [email])
    const user = users[0]
    if (!user || !(await bcrypt.compare(password, user.password_hash))) return res.status(401).json({ message: 'Incorrect email or password.' })
    setAuthCookie(res, user)
    res.json({ user: { name: user.name, email: user.email, role: user.role } })
  } catch (error) { console.error(error); res.status(500).json({ message: 'Unable to log in.' }) }
})

app.post('/api/admin/login', async (req, res) => {
  const { email, password } = req.body
  try {
    const [users] = await pool.execute("SELECT id, name, email, password_hash, role FROM users WHERE email = ? AND role = 'admin'", [email])
    const user = users[0]
    if (!user || !(await bcrypt.compare(password || '', user.password_hash))) return res.status(401).json({ message: 'Incorrect admin email or password.' })
    setAuthCookie(res, user)
    res.json({ user: { name: user.name, email: user.email, role: user.role } })
  } catch (error) { console.error(error); res.status(500).json({ message: 'Unable to log in as admin.' }) }
})

app.get('/api/auth/me', (req, res) => {
  try {
    const user = jwt.verify(req.cookies.nutrimatrix_token, jwtSecret)
    res.json({ user: { name: user.name, email: user.email, role: user.role || 'user' } })
  } catch { res.status(401).json({ message: 'Not authenticated.' }) }
})

app.post('/api/auth/logout', (req, res) => { res.clearCookie('nutrimatrix_token'); res.status(204).end() })

app.get('/api/admin/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [users] = await pool.execute(`SELECT u.id, u.name, u.email, u.role, u.created_at AS createdAt,
      p.phone, p.age, p.gender, p.height_cm AS heightCm, p.weight_kg AS weightKg,
      p.dietary_goal AS goals, p.diet_type AS dietType, p.allergies, p.food_dislikes AS foodDislikes,
      p.cuisines, p.monthly_budget AS monthlyBudget, p.price_conscious AS priceConscious,
      p.notifications, p.expiry_reminders AS expiryReminders, p.ai_recommendations AS aiRecommendations,
      p.updated_at AS profileUpdatedAt
      FROM users u LEFT JOIN nutrition_profiles p ON p.user_id = u.id ORDER BY u.created_at DESC`)
    res.json({ users })
  } catch (error) { console.error(error); res.status(500).json({ message: 'Unable to load users.' }) }
})

app.post('/api/auth/reset-password', async (req, res) => {
  const { email, password } = req.body
  try {
    const [result] = await pool.execute('UPDATE users SET password_hash = ? WHERE email = ?', [await bcrypt.hash(password, 12), email])
    if (!result.affectedRows) return res.status(404).json({ message: 'No account was found with this email address.' })
    res.json({ message: 'Password updated successfully.' })
  } catch (error) { console.error(error); res.status(500).json({ message: 'Unable to update password.' }) }
})

app.post('/api/scanner/search', (req, res) => {
  const { query } = req.body || {}
  const products = matchProducts(query)

  if (!query || !String(query).trim()) {
    return res.status(400).json({ message: 'Please enter a product name to search.' })
  }

  res.json({
    query: String(query).trim(),
    products: products.length ? products : sampleProductCatalog.slice(0, 3),
    source: 'mock-backend'
  })
})

app.post('/api/scanner/receipt', (req, res) => {
  const { receiptFileName, items = [] } = req.body || {}

  const products = buildReceiptProducts(items)
  res.json({
    receiptFileName: receiptFileName || 'receipt.jpg',
    totalItems: products.length,
    products,
    source: 'mock-backend'
  })
})

app.get('/api/expiry-products', requireAuth, async (req, res) => {
  try {
    const [products] = await pool.execute(`SELECT id, receipt_file_name AS receiptFileName, product_name AS name,
      brand, barcode, DATE_FORMAT(expiry_date, '%Y-%m-%d') AS expiryDate,
      DATE_FORMAT(purchased_at, '%Y-%m-%d') AS purchasedAt
      FROM receipt_products WHERE user_id = ? ORDER BY expiry_date IS NULL, expiry_date ASC, created_at DESC`, [req.user.id])
    res.json({ products: products.map((product) => ({ ...product, ...expiryStatus(product.expiryDate) })) })
  } catch (error) { console.error(error); res.status(500).json({ message: 'Unable to load expiry tracking.' }) }
})

app.post('/api/expiry-products', requireAuth, async (req, res) => {
  const { receiptFileName, products = [] } = req.body || {}
  if (!receiptFileName || !Array.isArray(products) || !products.length) return res.status(400).json({ message: 'Receipt products are required.' })
  if (products.some((product) => product.expiryDate && !/^\d{4}-\d{2}-\d{2}$/.test(product.expiryDate))) return res.status(400).json({ message: 'Please provide valid expiry dates.' })
  try {
    const purchasedAt = new Date().toISOString().slice(0, 10)
    for (const product of products) {
      if (!product.name) continue
      await pool.execute(`INSERT INTO receipt_products
        (user_id, receipt_file_name, product_name, brand, barcode, expiry_date, purchased_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)`, [req.user.id, receiptFileName, product.name, product.brand || null, product.barcode || null, product.expiryDate || null, purchasedAt])
    }
    res.status(201).json({ message: 'Receipt products saved.' })
  } catch (error) { console.error(error); res.status(500).json({ message: 'Unable to save receipt products.' }) }
})

app.put('/api/expiry-products/:id', requireAuth, async (req, res) => {
  const { expiryDate } = req.body || {}
  if (expiryDate && !/^\d{4}-\d{2}-\d{2}$/.test(expiryDate)) return res.status(400).json({ message: 'Please provide a valid expiry date.' })
  try {
    const [result] = await pool.execute('UPDATE receipt_products SET expiry_date = ? WHERE id = ? AND user_id = ?', [expiryDate || null, req.params.id, req.user.id])
    if (!result.affectedRows) return res.status(404).json({ message: 'Expiry product not found.' })
    res.json({ message: 'Expiry date updated.' })
  } catch (error) { console.error(error); res.status(500).json({ message: 'Unable to update expiry date.' }) }
})

app.delete('/api/expiry-products/receipt/:receiptFileName/:purchasedAt', requireAuth, async (req, res) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM receipt_products WHERE user_id = ? AND receipt_file_name = ? AND purchased_at = ?',
      [req.user.id, req.params.receiptFileName, req.params.purchasedAt]
    )
    if (!result.affectedRows) return res.status(404).json({ message: 'Receipt history not found.' })
    res.status(204).end()
  } catch (error) { console.error(error); res.status(500).json({ message: 'Unable to delete receipt history.' }) }
})

app.delete('/api/expiry-products/:id', requireAuth, async (req, res) => {
  try {
    const [result] = await pool.execute('DELETE FROM receipt_products WHERE id = ? AND user_id = ?', [req.params.id, req.user.id])
    if (!result.affectedRows) return res.status(404).json({ message: 'Expiry product not found.' })
    res.status(204).end()
  } catch (error) { console.error(error); res.status(500).json({ message: 'Unable to delete expiry product.' }) }
})

app.get('/api/profile', requireAuth, async (req, res) => {
  try {
    const [profiles] = await pool.execute('SELECT u.name, u.email, p.user_id AS profileUserId, p.phone, p.age, p.gender, p.height_cm AS heightCm, p.weight_kg AS weightKg, p.dietary_goal AS goals, p.diet_type AS dietType, p.allergies, p.food_dislikes AS foodDislikes, p.cuisines, p.monthly_budget AS monthlyBudget, p.price_conscious AS priceConscious, p.notifications, p.expiry_reminders AS expiryReminders, p.ai_recommendations AS aiRecommendations FROM users u LEFT JOIN nutrition_profiles p ON p.user_id = u.id WHERE u.id = ?', [req.user.id])
    const profile = profiles[0] || {}
    res.json({ profile, hasProfile: Boolean(profile.profileUserId) })
  } catch (error) { console.error(error); res.status(500).json({ message: 'Unable to load your nutrition profile.' }) }
})

app.put('/api/profile', requireAuth, async (req, res) => {
  const { name, phone, age, gender, heightCm, weightKg, goals, dietType, allergies, foodDislikes, cuisines, monthlyBudget, priceConscious, notifications, expiryReminders, aiRecommendations } = req.body
  if (!name || !goals || !dietType || !gender) return res.status(400).json({ message: 'Please complete the required profile choices.' })
  try {
    await pool.execute('UPDATE users SET name = ? WHERE id = ?', [name, req.user.id])
    await pool.execute(`INSERT INTO nutrition_profiles (user_id, phone, age, gender, height_cm, weight_kg, dietary_goal, diet_type, allergies, food_dislikes, cuisines, monthly_budget, price_conscious, notifications, expiry_reminders, ai_recommendations)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE phone = VALUES(phone), age = VALUES(age), gender = VALUES(gender), height_cm = VALUES(height_cm), weight_kg = VALUES(weight_kg), dietary_goal = VALUES(dietary_goal), diet_type = VALUES(diet_type), allergies = VALUES(allergies), food_dislikes = VALUES(food_dislikes), cuisines = VALUES(cuisines), monthly_budget = VALUES(monthly_budget), price_conscious = VALUES(price_conscious), notifications = VALUES(notifications), expiry_reminders = VALUES(expiry_reminders), ai_recommendations = VALUES(ai_recommendations)`, [req.user.id, phone || null, age || null, gender, heightCm || null, weightKg || null, goals, dietType, allergies || null, foodDislikes || null, cuisines || null, monthlyBudget || null, Boolean(priceConscious), Boolean(notifications), Boolean(expiryReminders), Boolean(aiRecommendations)])
    res.json({ message: 'Nutrition profile saved.' })
  } catch (error) { console.error(error); res.status(500).json({ message: 'Unable to save your nutrition profile.' }) }
})

ensureProfileColumns()
  .then(() => ensureReceiptProductsTable())
  .then(() => ensureAdminAccess())
  .then(() => app.listen(port, () => console.log(`NutriMatrix API running on http://localhost:${port}`)))
  .catch((error) => {
    console.error('Unable to prepare the nutrition profile table.', error)
    process.exit(1)
  })