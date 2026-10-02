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

async function ensureProductTables() {
  await pool.query(`CREATE TABLE IF NOT EXISTS products (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, product_name VARCHAR(255) NOT NULL, category VARCHAR(100) NOT NULL, image LONGTEXT NULL, calories DECIMAL(10,2) NULL, protein DECIMAL(10,2) NULL, carbohydrates DECIMAL(10,2) NULL, fat DECIMAL(10,2) NULL, fiber DECIMAL(10,2) NULL, sugar DECIMAL(10,2) NULL, sodium DECIMAL(10,2) NULL, health_benefits TEXT NULL, healthier_alternatives TEXT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`)
  await pool.query(`CREATE TABLE IF NOT EXISTS product_prices (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, product_id INT UNSIGNED NOT NULL, retailer VARCHAR(100) NOT NULL, price DECIMAL(10,2) NOT NULL, updated_at DATE NULL, CONSTRAINT fk_product_price FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE)`)
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

app.put('/api/admin/profile', requireAuth, requireAdmin, async (req, res) => {
  const { name, email } = req.body
  if (!name?.trim() || !email?.trim()) return res.status(400).json({ message: 'Name and email are required.' })
  try {
    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ? AND id != ?', [email.trim(), req.user.id])
    if (existing.length) return res.status(409).json({ message: 'That email address is already in use.' })
    await pool.execute('UPDATE users SET name = ?, email = ? WHERE id = ?', [name.trim(), email.trim(), req.user.id])
    const user = { id: req.user.id, name: name.trim(), email: email.trim(), role: 'admin' }
    setAuthCookie(res, user)
    res.json({ message: 'Admin profile updated.', user: { name: user.name, email: user.email, role: user.role } })
  } catch (error) { console.error(error); res.status(500).json({ message: 'Unable to update admin profile.' }) }
})

app.put('/api/admin/password', requireAuth, requireAdmin, async (req, res) => {
  const { currentPassword, newPassword } = req.body
  if (!currentPassword || !newPassword || newPassword.length < 8) return res.status(400).json({ message: 'Enter your current password and a new password of at least 8 characters.' })
  try {
    const [rows] = await pool.execute('SELECT password_hash FROM users WHERE id = ?', [req.user.id])
    if (!rows[0] || !(await bcrypt.compare(currentPassword, rows[0].password_hash))) return res.status(401).json({ message: 'Your current password is incorrect.' })
    await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [await bcrypt.hash(newPassword, 12), req.user.id])
    res.json({ message: 'Password changed successfully.' })
  } catch (error) { console.error(error); res.status(500).json({ message: 'Unable to change password.' }) }
})

function validateProduct(body) {
  if (!body.productName?.trim() || !body.category) throw new Error('Product name and category are required.')
  const nutrition = ['calories','protein','carbohydrates','fat','fiber','sugar','sodium'].map((key) => {
    if (body[key] !== '' && body[key] !== undefined && Number(body[key]) < 0) throw new Error('Nutrition values cannot be negative.')
    return body[key] === '' || body[key] === undefined ? null : Number(body[key])
  })
  for (const price of body.prices || []) if (price.price !== '' && Number(price.price) < 0) throw new Error('Price cannot be negative.')
  return nutrition
}
async function adminProducts() {
  const [rows] = await pool.query(`SELECT p.id,p.product_name AS productName,p.category,p.image,p.calories,p.protein,p.carbohydrates,p.fat,p.fiber,p.sugar,p.sodium,p.health_benefits AS healthBenefits,p.healthier_alternatives AS healthierAlternatives,p.created_at AS createdAt,p.updated_at AS updatedAt,pp.retailer,pp.price,pp.updated_at AS priceUpdatedAt FROM products p LEFT JOIN product_prices pp ON pp.product_id=p.id ORDER BY p.updated_at DESC`)
  const indexed = new Map()
  rows.forEach((row) => { if (!indexed.has(row.id)) { const { retailer, price, priceUpdatedAt, ...product } = row; indexed.set(row.id, { ...product, prices: [] }) }; if (row.retailer) indexed.get(row.id).prices.push({ retailer: row.retailer, price: Number(row.price), updatedAt: row.priceUpdatedAt }) })
  return [...indexed.values()]
}
app.get('/api/admin/products', requireAuth, requireAdmin, async (req,res) => { try { res.json({ products: await adminProducts() }) } catch (error) { console.error(error); res.status(500).json({ message:'Unable to load products.' }) } })
app.get('/api/products', async (req,res) => { try { res.json({ products: await adminProducts() }) } catch (error) { console.error(error); res.status(500).json({ message:'Unable to load products.' }) } })
app.get('/api/admin/dashboard', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [[productCount]] = await pool.query('SELECT COUNT(*) AS total FROM products')
    const [[userCount]] = await pool.query("SELECT COUNT(*) AS total FROM users WHERE role != 'admin'")
    // Pantry storage is not present in older installations; return truthful zeroes until users add pantry data.
    let pantryItems = 0, expiryAlerts = 0
    const [tables] = await pool.query("SHOW TABLES LIKE 'pantry_items'")
    if (tables.length) {
      const [[pantry]] = await pool.query('SELECT COUNT(*) AS total FROM pantry_items')
      const [[alerts]] = await pool.query("SELECT COUNT(*) AS total FROM pantry_items WHERE expiry_date IS NOT NULL AND expiry_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)")
      pantryItems = pantry.total; expiryAlerts = alerts.total
    }
    const [activity] = await pool.query("SELECT 'Product updated' AS activity, product_name AS detail, updated_at AS occurredAt, 'Admin' AS actor FROM products UNION ALL SELECT 'User registered', name, created_at, 'User' FROM users WHERE role != 'admin' ORDER BY occurredAt DESC LIMIT 8")
    res.json({ stats: { products: productCount.total, users: userCount.total, pantryItems, expiryAlerts }, activity })
  } catch (error) { console.error(error); res.status(500).json({ message: 'Unable to load dashboard data.' }) }
})
async function persistProduct(req,res,id) { try { const b=req.body, values=validateProduct(b); let productId=id; if (id) await pool.execute('UPDATE products SET product_name=?,category=?,image=?,calories=?,protein=?,carbohydrates=?,fat=?,fiber=?,sugar=?,sodium=?,health_benefits=?,healthier_alternatives=? WHERE id=?',[b.productName.trim(),b.category,b.image||null,...values,b.healthBenefits||null,b.healthierAlternatives||null,id]); else { const [result]=await pool.execute('INSERT INTO products (product_name,category,image,calories,protein,carbohydrates,fat,fiber,sugar,sodium,health_benefits,healthier_alternatives) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',[b.productName.trim(),b.category,b.image||null,...values,b.healthBenefits||null,b.healthierAlternatives||null]); productId=result.insertId }; await pool.execute('DELETE FROM product_prices WHERE product_id=?',[productId]); for(const p of b.prices||[]) if(p.price !== '' && p.price != null) await pool.execute('INSERT INTO product_prices (product_id,retailer,price,updated_at) VALUES (?,?,?,?)',[productId,p.retailer,Number(p.price),p.updatedAt||null]); res.status(id?200:201).json({message:id?'Product updated successfully.':'Product added successfully.',id:productId}) } catch(error) { console.error(error); res.status(error.message?.includes('required')||error.message?.includes('negative')?400:500).json({message:error.message||'Unable to save product.'}) } }
app.post('/api/admin/products', requireAuth, requireAdmin, (req,res) => persistProduct(req,res))
app.put('/api/admin/products/:id', requireAuth, requireAdmin, (req,res) => persistProduct(req,res,Number(req.params.id)))
app.delete('/api/admin/products/:id', requireAuth, requireAdmin, async (req,res) => { try { await pool.execute('DELETE FROM products WHERE id=?',[req.params.id]); res.status(204).end() } catch(error) { console.error(error); res.status(500).json({message:'Unable to delete product.'}) } })

app.post('/api/auth/reset-password', async (req, res) => {
  const { email, password } = req.body
  try {
    const [result] = await pool.execute('UPDATE users SET password_hash = ? WHERE email = ?', [await bcrypt.hash(password, 12), email])
    if (!result.affectedRows) return res.status(404).json({ message: 'No account was found with this email address.' })
    res.json({ message: 'Password updated successfully.' })
  } catch (error) { console.error(error); res.status(500).json({ message: 'Unable to update password.' }) }
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
  .then(() => ensureProductTables())
  .then(() => ensureAdminAccess())
  .then(() => app.listen(port, () => console.log(`NutriMatrix API running on http://localhost:${port}`)))
  .catch((error) => {
    console.error('Unable to prepare the nutrition profile table.', error)
    process.exit(1)
  })
