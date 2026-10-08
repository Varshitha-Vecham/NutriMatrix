import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import multer from 'multer'
import mysql from 'mysql2/promise'
import nodemailer from 'nodemailer'
import crypto from 'crypto'
import { createWorker } from 'tesseract.js'
import { extractExpiryDateFromText, validDateString } from './expiry-detection.js'

const app = express()
const port = process.env.API_PORT || 3001
const jwtSecret = process.env.JWT_SECRET || 'change-this-secret'
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost', port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'nutrimatrix', waitForConnections: true, connectionLimit: 10
})
const OTP_EXPIRY_MINUTES = 5
const OTP_RESEND_COOLDOWN_SECONDS = 120
const OTP_MAX_ATTEMPTS = 4
let mailTransport

class EmailDeliveryError extends Error {}

function createMailTransport() {
  const port = Number(process.env.SMTP_PORT || 587)
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST?.trim(),
    port,
    // Gmail submission on 587 starts unencrypted and upgrades with STARTTLS.
    secure: false,
    auth: { user: process.env.SMTP_USER?.trim(), pass: process.env.SMTP_PASSWORD?.trim() },
    // Do not leave the registration form waiting indefinitely when the SMTP
    // server is unreachable or its credentials are rejected.
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 8000
  })
}

function emailIsConfigured() {
  return ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD', 'SMTP_FROM'].every((key) => process.env[key]?.trim())
}

async function sendVerificationEmail(email, otp) {
  if (!emailIsConfigured()) throw new EmailDeliveryError('Email delivery is not configured.')
  try {
    const sender = process.env.SMTP_FROM.trim()
    const from = sender.includes('<') ? sender : `NutriMatrix <${sender}>`
    await (mailTransport || (mailTransport = createMailTransport())).sendMail({
      from,
      to: email,
      subject: `${otp} is your NutriMatrix verification code`,
      text: `Hello,\n\nUse this verification code to finish creating your NutriMatrix account:\n\n${otp}\n\nThis code expires in ${OTP_EXPIRY_MINUTES} minutes. If you did not request this code, you can ignore this email. Do not share this code with anyone.\n\nNutriMatrix`,
      html: `<div style="margin:0;padding:32px 16px;background:#f4f8f4;font-family:Arial,sans-serif;color:#25332a"><div style="max-width:480px;margin:0 auto;padding:32px;background:#fff;border:1px solid #e2ebe2;border-radius:12px"><h1 style="margin:0 0 20px;color:#168344;font-size:24px">Verify your NutriMatrix email</h1><p style="margin:0 0 20px;line-height:1.5">Use this code to finish creating your account:</p><p style="margin:0 0 20px;padding:16px;background:#f4f8f4;border-radius:8px;text-align:center;font-size:32px;font-weight:bold;letter-spacing:8px">${otp}</p><p style="margin:0 0 12px;line-height:1.5">This code expires in ${OTP_EXPIRY_MINUTES} minutes. Do not share it with anyone.</p><p style="margin:0;color:#647067;font-size:13px;line-height:1.5">If you did not request this code, you can ignore this email.</p></div></div>`
    })
  } catch (error) {
    console.error('OTP email failed:', {
      code: error.code,
      command: error.command,
      response: error.response,
      message: error.message
    })
    throw new EmailDeliveryError('Unable to send verification code. Please try again.')
  }
}

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
  },
  {
    id: 7,
    name: 'Dark Fantasy Sunfeast Sandwich Cream',
    brand: 'Sunfeast',
    category: 'Biscuits and cookies',
    barcode: '8909081003844',
    price: 40,
    image: '',
    nutrition: { calories: 486, protein: 5.7, carbs: 67, fat: 22, fiber: 1.5 },
    description: 'Chocolate sandwich biscuits with a cream filling. Package-specific batch and date details are read by NutriMatrix OCR.'
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

function normalizeCountry(country) {
  const value = String(country || 'India').trim()
  if (!value) return 'India'
  return value
}

function normalizeBarcodeInput(value) {
  const cleaned = String(value || '').replace(/\D/g, '')
  return cleaned
}

async function fetchOpenFoodFacts(path, params = {}) {
  const url = new URL(path, 'https://world.openfoodfacts.org')
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    url.searchParams.set(key, String(value))
  }

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'NutriMatrix/1.0 (contact: support@nutrimatrix.local)',
      Accept: 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error('Unable to connect to Open Food Facts.')
  }

  return response.json()
}

function mapOpenFoodFactsProduct(product = {}) {
  const productName = product.product_name || product.product_name_en || product.generic_name || product.name || 'Unknown product'
  const brand = product.brands || product.brand || ''
  const category = product.categories || product.category || product.categories_hierarchy?.[0] || ''
  const barcode = product.code || product.barcode || ''
  const image = product.image_url || product.image_front_url || product.image_front_small_url || product.selected_images?.front?.display?.fr || ''
  const nutriments = product.nutriments || {}

  return {
    id: product._id || barcode || `off-${Date.now()}`,
    name: productName,
    brand,
    category,
    barcode,
    image,
    nutrition: {
      calories: nutriments['energy-kcal_100g'] ?? nutriments.energy_100g ?? null,
      protein: nutriments.proteins_100g ?? null,
      carbs: nutriments.carbohydrates_100g ?? null,
      fat: nutriments.fat_100g ?? null,
      fiber: nutriments.fiber_100g ?? null
    },
    description: product.generic_name || product.product_name || 'Product information retrieved from Open Food Facts.'
  }
}

function productFromCatalog(product) {
  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    category: product.category,
    barcode: product.barcode,
    price: product.price,
    image: product.image,
    expiryDate: product.expiryDate || null,
    manufacturingDate: product.manufacturingDate || null,
    batchNumber: product.batchNumber || null,
    nutrition: product.nutrition,
    description: product.description,
    source: 'local-catalog'
  }
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
    category VARCHAR(100) NULL,
    barcode VARCHAR(50) NULL,
    quantity VARCHAR(50) NULL,
    unit VARCHAR(30) NULL,
    manufacturing_date DATE NULL,
    image VARCHAR(500) NULL,
    source VARCHAR(30) NOT NULL DEFAULT 'receipt',
    expiry_date DATE NULL,
    purchased_at DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_receipt_product_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_receipt_products_user_expiry (user_id, expiry_date)
  )`)
  const [columns] = await pool.query('SHOW COLUMNS FROM receipt_products')
  const existingColumns = new Set(columns.map((column) => column.Field))
  const requiredColumns = {
    category: 'VARCHAR(100) NULL',
    quantity: 'VARCHAR(50) NULL',
    unit: 'VARCHAR(30) NULL',
    manufacturing_date: 'DATE NULL',
    image: 'VARCHAR(500) NULL',
    source: "VARCHAR(30) NOT NULL DEFAULT 'receipt'"
  }
  for (const [columnName, definition] of Object.entries(requiredColumns)) {
    if (!existingColumns.has(columnName)) await pool.query(`ALTER TABLE receipt_products ADD COLUMN ${columnName} ${definition}`)
  }
}

async function ensureSavedMealsTable() {
  await pool.query(`CREATE TABLE IF NOT EXISTS saved_meals (
    user_id INT UNSIGNED PRIMARY KEY,
    meals JSON NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_saved_meals_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`)
}

function expiryStatus(expiryDate) {
  if (!expiryDate) return 'Unavailable'
  const today = new Date()
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  const [year, month, day] = String(expiryDate).slice(0, 10).split('-').map(Number)
  const expiryUtc = Date.UTC(year, month - 1, day)
  const daysRemaining = Math.round((expiryUtc - todayUtc) / 86400000)
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

async function ensureEmailVerificationColumns() {
  const [columns] = await pool.query('SHOW COLUMNS FROM users')
  const existingColumns = new Set(columns.map((column) => column.Field))
  const requiredColumns = {
    email_verified: 'BOOLEAN NOT NULL DEFAULT FALSE', email_verified_at: 'DATETIME NULL',
    otp_code: 'VARCHAR(255) NULL', otp_expires_at: 'DATETIME NULL',
    otp_attempts: 'TINYINT UNSIGNED NOT NULL DEFAULT 0', otp_last_sent_at: 'DATETIME NULL'
  }
  for (const [columnName, definition] of Object.entries(requiredColumns)) {
    if (!existingColumns.has(columnName)) await pool.query(`ALTER TABLE users ADD COLUMN ${columnName} ${definition}`)
  }
}

async function ensurePendingRegistrationsTable() {
  await pool.query(`CREATE TABLE IF NOT EXISTS pending_registrations (
    email VARCHAR(255) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    otp_code VARCHAR(255) NOT NULL,
    otp_expires_at DATETIME NOT NULL,
    otp_attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
    otp_last_sent_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_pending_registrations_expiry (otp_expires_at)
  )`)
}

async function verifySmtpConnection() {
  if (!emailIsConfigured()) {
    console.error('SMTP connection failed: required SMTP environment variables are missing.')
    return
  }
  try {
    mailTransport = createMailTransport()
    await mailTransport.verify()
    console.log('SMTP connection successful')
  } catch (error) {
    console.error('SMTP connection failed:', {
      code: error.code,
      command: error.command,
      response: error.response,
      message: error.message
    })
  }
}

async function ensureProductTables() {
  await pool.query(`CREATE TABLE IF NOT EXISTS products (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, product_name VARCHAR(255) NOT NULL, category VARCHAR(100) NOT NULL, image LONGTEXT NULL, calories DECIMAL(10,2) NULL, protein DECIMAL(10,2) NULL, carbohydrates DECIMAL(10,2) NULL, fat DECIMAL(10,2) NULL, fiber DECIMAL(10,2) NULL, sugar DECIMAL(10,2) NULL, sodium DECIMAL(10,2) NULL, health_benefits TEXT NULL, healthier_alternatives TEXT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`)
  await pool.query(`CREATE TABLE IF NOT EXISTS product_prices (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, product_id INT UNSIGNED NOT NULL, retailer VARCHAR(100) NOT NULL, price DECIMAL(10,2) NOT NULL, updated_at DATE NULL, CONSTRAINT fk_product_price FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE)`)
  await pool.query(`CREATE TABLE IF NOT EXISTS product_activity (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, activity VARCHAR(50) NOT NULL, detail VARCHAR(255) NOT NULL, occurred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX idx_product_activity_occurred_at (occurred_at))`)
  await pool.query(`CREATE TABLE IF NOT EXISTS product_catalogue_seed (catalogue_version VARCHAR(50) PRIMARY KEY, seeded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`)
  const [columns] = await pool.query('SHOW COLUMNS FROM products')
  if (!columns.some((column) => column.Field === 'is_active')) {
    await pool.query('ALTER TABLE products ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE')
  }

  const legacyProducts = [
    'Organic Greek Yogurt', 'Avocado Hass', 'Red Bell Peppers', 'Wild Blueberries',
    'Baby Spinach', 'Almond Butter', 'Honeycrisp Apples', 'Cherry Tomatoes',
    'Free-Range Eggs', 'Whole Grain Oats', 'Broccoli Crowns', 'Strawberries',
    'Bananas', 'Fresh Paneer', 'Toned Milk', 'Yellow Moong Dal',
  ]
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const [migration] = await connection.execute(
      "INSERT IGNORE INTO product_catalogue_seed (catalogue_version) VALUES ('remove-legacy-admin-products-v1')"
    )
    if (migration.affectedRows) {
      await connection.query('UPDATE products SET is_active = FALSE WHERE product_name IN (?)', [legacyProducts])
    }
    await connection.commit()
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

app.use(cors({ origin: [process.env.CLIENT_URL || 'http://localhost:5173', 'http://localhost:5174'], credentials: true }))
app.use(express.json({ limit: '8mb' }))
app.use(cookieParser())

// Development-only diagnostic endpoint. It intentionally cannot be used in production.
app.post('/api/auth/test-smtp', async (req, res) => {
  if (process.env.NODE_ENV === 'production') return res.status(404).end()
  const email = normalizeEmail(req.body?.email)
  if (!isValidEmailAddress(email)) return res.status(400).json({ message: 'Please enter a valid email address.' })
  try {
    await sendVerificationEmail(email, '000000')
    res.json({ message: 'SMTP test email sent successfully.' })
  } catch (error) {
    if (error instanceof EmailDeliveryError) return res.status(503).json({ message: error.message })
    console.error('SMTP test failed:', error)
    res.status(500).json({ message: 'Unable to send SMTP test email.' })
  }
})

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

function normalizeEmail(value = '') {
  return String(value).trim().toLowerCase()
}

function isValidEmailAddress(value = '') {
  const normalized = normalizeEmail(value)
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalized)
}

function generateOtp() { return String(crypto.randomInt(0, 1000000)).padStart(6, '0') }

async function issueVerificationOtp(email) {
  const otp = generateOtp()
  await sendVerificationEmail(email, otp)
  return bcrypt.hash(otp, 12)
}

app.post('/api/auth/register', async (req, res) => {
  const name = String(req.body.name || '').trim()
  const email = normalizeEmail(req.body.email)
  const password = String(req.body.password || '')

  if (!name || !email || !password) return res.status(400).json({ message: 'All fields are required.' })
  if (!isValidEmailAddress(email)) return res.status(400).json({ message: 'Please enter a valid email address.' })

  try {
    const [existing] = await pool.execute('SELECT id FROM users WHERE LOWER(TRIM(email)) = ?', [email])
    if (existing[0]) return res.status(409).json({ message: 'An account with this email already exists. Please login.' })
    const [pendingRows] = await pool.execute('SELECT otp_last_sent_at FROM pending_registrations WHERE email = ?', [email])
    const pending = pendingRows[0]
    const elapsed = pending?.otp_last_sent_at ? Date.now() - new Date(pending.otp_last_sent_at).getTime() : Infinity
    if (elapsed < OTP_RESEND_COOLDOWN_SECONDS * 1000) {
      const seconds = Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - elapsed / 1000)
      return res.status(429).json({ message: `Please wait ${seconds} seconds before requesting another verification code.`, resendAfterSeconds: seconds })
    }
    const otpHash = await issueVerificationOtp(email)
    await pool.execute(`INSERT INTO pending_registrations (email, name, password_hash, otp_code, otp_expires_at, otp_attempts, otp_last_sent_at)
      VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE), 0, NOW())
      ON DUPLICATE KEY UPDATE name = VALUES(name), password_hash = VALUES(password_hash), otp_code = VALUES(otp_code),
      otp_expires_at = VALUES(otp_expires_at), otp_attempts = 0, otp_last_sent_at = NOW()`,
    [email, name, await bcrypt.hash(password, 12), otpHash, OTP_EXPIRY_MINUTES])
    res.status(201).json({ message: 'Verification code sent successfully.', resendAfterSeconds: OTP_RESEND_COOLDOWN_SECONDS })
  } catch (error) {
    if (error instanceof EmailDeliveryError) return res.status(503).json({ message: error.message })
    console.error(error)
    res.status(500).json({ message: 'Unable to create your pending account. Please try again.' })
  }
})

app.post('/api/auth/resend-verification', async (req, res) => {
  const email = normalizeEmail(req.body.email)
  if (!isValidEmailAddress(email)) return res.status(400).json({ message: 'Please enter a valid email address.' })
  try {
    const [pendingRows] = await pool.execute('SELECT otp_last_sent_at FROM pending_registrations WHERE email = ?', [email])
    const pending = pendingRows[0]
    if (!pending) return res.status(404).json({ message: 'No pending account was found for this email address.' })
    const elapsed = pending.otp_last_sent_at ? Date.now() - new Date(pending.otp_last_sent_at).getTime() : Infinity
    if (elapsed < OTP_RESEND_COOLDOWN_SECONDS * 1000) {
      const seconds = Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - elapsed / 1000)
      return res.status(429).json({ message: `Please wait ${seconds} seconds before requesting another verification code.`, resendAfterSeconds: seconds })
    }
    const otpHash = await issueVerificationOtp(email)
    await pool.execute(`UPDATE pending_registrations SET otp_code = ?, otp_expires_at = DATE_ADD(NOW(), INTERVAL ? MINUTE),
      otp_attempts = 0, otp_last_sent_at = NOW() WHERE email = ?`, [otpHash, OTP_EXPIRY_MINUTES, email])
    res.json({ message: 'Verification code sent successfully.', resendAfterSeconds: OTP_RESEND_COOLDOWN_SECONDS })
  } catch (error) {
    if (error instanceof EmailDeliveryError) return res.status(503).json({ message: error.message })
    console.error(error)
    res.status(500).json({ message: 'Unable to send a new verification code. Please try again.' })
  }
})

app.post('/api/auth/verify-email', async (req, res) => {
  const email = normalizeEmail(req.body.email)
  const otp = String(req.body.otp || '')
  if (!isValidEmailAddress(email) || !/^\d{6}$/.test(otp)) return res.status(400).json({ message: 'Enter the 6-digit verification code.' })
  try {
    const [pendingRows] = await pool.execute('SELECT name, password_hash, otp_code, otp_expires_at, otp_attempts FROM pending_registrations WHERE email = ?', [email])
    const pending = pendingRows[0]
    if (!pending) return res.status(404).json({ message: 'No pending account was found for this email address.' })
    if (!pending.otp_code || new Date(pending.otp_expires_at).getTime() <= Date.now()) return res.status(400).json({ message: 'Verification code has expired. Please request a new code.' })
    if (pending.otp_attempts >= OTP_MAX_ATTEMPTS) return res.status(429).json({ message: 'Too many OTP attempts. Please request a new OTP.' })
    if (!(await bcrypt.compare(otp, pending.otp_code))) {
      const attempts = pending.otp_attempts + 1
      await pool.execute('UPDATE pending_registrations SET otp_attempts = ? WHERE email = ?', [attempts, email])
      if (attempts >= OTP_MAX_ATTEMPTS) return res.status(429).json({ message: 'Too many OTP attempts. Please request a new OTP.' })
      return res.status(400).json({ message: 'Invalid verification code. Please try again.' })
    }
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()
      await connection.execute('INSERT INTO users (name, email, password_hash, email_verified, email_verified_at) VALUES (?, ?, ?, TRUE, NOW())', [pending.name, email, pending.password_hash])
      await connection.execute('DELETE FROM pending_registrations WHERE email = ?', [email])
      await connection.commit()
    } catch (error) {
      await connection.rollback()
      if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'An account with this email already exists. Please login.' })
      throw error
    } finally { connection.release() }
    res.json({ message: 'Email verified successfully! Your account has been created.' })
  } catch (error) { console.error('Email verification failed:', error); res.status(500).json({ message: 'Unable to verify email. Please try again.' }) }
})

app.post('/api/auth/login', async (req, res) => {
  const email = normalizeEmail(req.body.email)
  const password = String(req.body.password || '')

  try {
    const [users] = await pool.execute('SELECT id, name, email, password_hash, role, email_verified FROM users WHERE LOWER(TRIM(email)) = ?', [email])
    const user = users[0]
    if (!user || !(await bcrypt.compare(password, user.password_hash))) return res.status(401).json({ message: 'Incorrect email or password.' })
    if (!user.email_verified) return res.status(403).json({ message: 'Please verify your email before logging in.' })
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
    if (body[key] !== '' && body[key] !== undefined && (!Number.isFinite(Number(body[key])) || Number(body[key]) < 0)) throw new Error('Nutrition values must be valid non-negative numbers.')
    return body[key] === '' || body[key] === undefined ? null : Number(body[key])
  })
  const bigBasketPrice = (body.prices || []).find((price) => price.retailer?.trim().toLowerCase() === 'bigbasket')
  if (!bigBasketPrice || bigBasketPrice.price === '' || bigBasketPrice.price == null || !Number.isFinite(Number(bigBasketPrice.price))) {
    throw new Error('A valid BigBasket price is required.')
  }
  for (const price of body.prices || []) {
    if (price.price !== '' && price.price != null && (!Number.isFinite(Number(price.price)) || Number(price.price) < 0)) {
      throw new Error('Prices must be valid non-negative numbers.')
    }
  }
  return nutrition
}
async function adminProducts() {
  const [rows] = await pool.query(`SELECT p.id,p.product_name AS productName,p.category,p.image,p.calories,p.protein,p.carbohydrates,p.fat,p.fiber,p.sugar,p.sodium,p.healthier_alternatives AS healthierAlternatives,p.is_active AS isActive,p.created_at AS createdAt,p.updated_at AS updatedAt,pp.retailer,pp.price,pp.updated_at AS priceUpdatedAt FROM products p LEFT JOIN product_prices pp ON pp.product_id=p.id ORDER BY p.updated_at DESC`)
  const indexed = new Map()
  rows.forEach((row) => { if (!indexed.has(row.id)) { const { retailer, price, priceUpdatedAt, ...product } = row; indexed.set(row.id, { ...product, prices: [] }) }; if (row.retailer) indexed.get(row.id).prices.push({ retailer: row.retailer, price: Number(row.price), updatedAt: row.priceUpdatedAt }) })
  return [...indexed.values()]
}
app.post('/api/admin/products/catalogue', requireAuth, requireAdmin, async (req, res) => {
  const catalogue = req.body?.products
  if (!Array.isArray(catalogue) || catalogue.length !== 100 ||
      catalogue.some((product) =>
        !product || typeof product.name !== 'string' || !product.name.trim() ||
        typeof product.category !== 'string' || !product.category.trim() ||
        ['calories', 'protein', 'carbs', 'fat', 'fiber', 'sugar', 'sodium'].some((key) =>
          !Number.isFinite(Number(product[key]))
        ) ||
        !Array.isArray(product.retailers) ||
        !product.retailers.some((entry) => entry.name === 'BigBasket' && Number.isFinite(Number(entry.price)) && Number(entry.price) >= 0)
      )) {
    return res.status(400).json({ message: 'The Product Analysis catalogue must contain 100 valid products.' })
  }

  let connection
  try {
    const names = catalogue.map((product) => product.name.trim())
    if (new Set(names.map((name) => name.toLowerCase())).size !== 100) {
      return res.status(400).json({ message: 'The Product Analysis catalogue contains duplicate product names.' })
    }
    connection = await pool.getConnection()
    await connection.beginTransaction()
    const [seed] = await connection.execute(
      "INSERT IGNORE INTO product_catalogue_seed (catalogue_version) VALUES ('analysis-100-v1')"
    )

    const [existing] = await connection.query('SELECT id, product_name AS productName FROM products WHERE product_name IN (?)', [names])
    const existingNames = new Set(existing.map((product) => product.productName.toLowerCase()))
    const missing = seed.affectedRows
      ? catalogue.filter((product) => !existingNames.has(product.name.trim().toLowerCase()))
      : []

    if (missing.length) {
      const values = missing.map((product) => [
        product.name.trim(),
        product.category,
        product.image || null,
        product.calories,
        product.protein,
        product.carbs,
        product.fat,
        product.fiber,
        product.sugar,
        product.sodium,
      ])
      await connection.query(
        'INSERT INTO products (product_name, category, image, calories, protein, carbohydrates, fat, fiber, sugar, sodium) VALUES ?',
        [values]
      )
    }

    const [priceSeed] = await connection.execute(
      "INSERT IGNORE INTO product_catalogue_seed (catalogue_version) VALUES ('analysis-100-prices-v1')"
    )
    let pricesAdded = 0
    if (priceSeed.affectedRows) {
      const [catalogueProducts] = await connection.query(
        'SELECT id, product_name AS productName FROM products WHERE product_name IN (?)',
        [names]
      )
      const productIds = new Map(catalogueProducts.map((product) => [product.productName.toLowerCase(), product.id]))
      const [existingPrices] = await connection.query(
        'SELECT pp.product_id AS productId, pp.retailer FROM product_prices pp JOIN products p ON p.id = pp.product_id WHERE p.product_name IN (?)',
        [names]
      )
      const priceKeys = new Set(existingPrices.map((entry) => `${entry.productId}:${entry.retailer.trim().toLowerCase()}`))
      const newPrices = catalogue.flatMap((product) => {
        const productId = productIds.get(product.name.trim().toLowerCase())
        return product.retailers.flatMap((entry) => {
          const key = `${productId}:${entry.name.trim().toLowerCase()}`
          return productId && !priceKeys.has(key)
            ? [[productId, entry.name.trim(), Number(entry.price)]]
            : []
        })
      })
      if (newPrices.length) {
        await connection.query(
          'INSERT INTO product_prices (product_id, retailer, price) VALUES ?',
          [newPrices]
        )
        pricesAdded = newPrices.length
      }
    }

    await connection.commit()
    res.json({ added: missing.length, pricesAdded, total: 100 })
  } catch (error) {
    if (connection) await connection.rollback()
    console.error(error)
    res.status(500).json({ message: 'Unable to sync the Product Analysis catalogue.' })
  } finally {
    connection?.release()
  }
})
app.get('/api/admin/products', requireAuth, requireAdmin, async (req,res) => { try { res.json({ products: await adminProducts() }) } catch (error) { console.error(error); res.status(500).json({ message:'Unable to load products.' }) } })
app.get('/api/products', async (req,res) => { try { res.set('Cache-Control', 'no-store').json({ products: (await adminProducts()).filter((product) => product.isActive) }) } catch (error) { console.error(error); res.status(500).json({ message:'Unable to load products.' }) } })
app.get('/api/admin/dashboard', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [[productCount]] = await pool.query('SELECT COUNT(*) AS total FROM products')
    const [[userCount]] = await pool.query("SELECT COUNT(*) AS total FROM users WHERE role != 'admin'")
    const [[pantry]] = await pool.query('SELECT COUNT(*) AS total FROM receipt_products')
    const [[alerts]] = await pool.query(`SELECT COUNT(*) AS total FROM receipt_products
      WHERE expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)`)
    const [activity] = await pool.query('SELECT activity, detail, occurred_at AS occurredAt, ? AS actor FROM product_activity ORDER BY occurred_at DESC LIMIT 8', ['Admin'])
    res.json({ stats: { products: productCount.total, users: userCount.total, pantryItems: pantry.total, expiryAlerts: alerts.total }, activity })
  } catch (error) { console.error(error); res.status(500).json({ message: 'Unable to load dashboard data.' }) }
})
async function persistProduct(req, res, id) {
  let connection
  let transactionStarted = false
  try {
    const body = req.body
    const nutrition = validateProduct(body)
    connection = await pool.getConnection()
    await connection.beginTransaction()
    transactionStarted = true

    let productId = id
    if (id) {
      const [existing] = await connection.execute('SELECT id FROM products WHERE id = ? FOR UPDATE', [id])
      if (!existing.length) {
        await connection.rollback()
        transactionStarted = false
        return res.status(404).json({ message: 'Product not found.' })
      }
      await connection.execute(
        'UPDATE products SET product_name=?,category=?,image=?,calories=?,protein=?,carbohydrates=?,fat=?,fiber=?,sugar=?,sodium=?,healthier_alternatives=? WHERE id=?',
        [body.productName.trim(), body.category, body.image || null, ...nutrition, body.healthierAlternatives || null, id]
      )
    } else {
      const [result] = await connection.execute(
        'INSERT INTO products (product_name,category,image,calories,protein,carbohydrates,fat,fiber,sugar,sodium,healthier_alternatives) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
        [body.productName.trim(), body.category, body.image || null, ...nutrition, body.healthierAlternatives || null]
      )
      productId = result.insertId
    }

    await connection.execute('DELETE FROM product_prices WHERE product_id=?', [productId])
    for (const entry of body.prices || []) {
      if (entry.price !== '' && entry.price != null) {
        await connection.execute(
          'INSERT INTO product_prices (product_id,retailer,price,updated_at) VALUES (?,?,?,?)',
          [productId, entry.retailer, Number(entry.price), entry.updatedAt || null]
        )
      }
    }
    await connection.execute(
      'INSERT INTO product_activity (activity, detail) VALUES (?, ?)',
      [id ? 'Product updated' : 'Product added', body.productName.trim()]
    )
    await connection.commit()
    transactionStarted = false
    res.status(id ? 200 : 201).json({
      message: id ? 'Product updated successfully.' : 'Product added successfully.',
      id: productId,
    })
  } catch (error) {
    if (connection && transactionStarted) {
      try {
        await connection.rollback()
      } catch (rollbackError) {
        console.error('Unable to roll back the product save transaction.', rollbackError)
      }
    }
    console.error(error)
    res.status(error.message?.includes('required') || error.message?.includes('negative') || error.message?.includes('valid') ? 400 : 500)
      .json({ message: error.message || 'Unable to save product.' })
  } finally {
    connection?.release()
  }
}
app.post('/api/admin/products', requireAuth, requireAdmin, (req,res) => persistProduct(req,res))
app.put('/api/admin/products/:id', requireAuth, requireAdmin, (req,res) => persistProduct(req,res,Number(req.params.id)))
app.post('/api/admin/products/restore-all', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [result] = await pool.execute('UPDATE products SET is_active = TRUE WHERE is_active = FALSE')
    res.json({ restored: result.affectedRows })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Unable to restore deleted products.' })
  }
})
app.delete('/api/admin/products/deleted', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [result] = await pool.execute('DELETE FROM products WHERE is_active = FALSE')
    res.json({ deleted: result.affectedRows })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Unable to permanently delete deleted products.' })
  }
})
app.delete('/api/admin/products/:id', requireAuth, requireAdmin, async (req,res) => { try { await pool.execute('UPDATE products SET is_active = FALSE WHERE id = ?', [req.params.id]); res.status(204).end() } catch(error) { console.error(error); res.status(500).json({message:'Unable to delete product.'}) } })
app.post('/api/admin/products/:id/restore', requireAuth, requireAdmin, async (req,res) => { try { const [result] = await pool.execute('UPDATE products SET is_active = TRUE WHERE id = ?', [req.params.id]); if (!result.affectedRows) return res.status(404).json({ message: 'Product not found.' }); res.json({ message: 'Product restored successfully.' }) } catch(error) { console.error(error); res.status(500).json({message:'Unable to restore product.'}) } })

app.post('/api/auth/reset-password', async (req, res) => {
  const { email, password } = req.body
  try {
    const [result] = await pool.execute('UPDATE users SET password_hash = ? WHERE email = ?', [await bcrypt.hash(password, 12), email])
    if (!result.affectedRows) return res.status(404).json({ message: 'No account was found with this email address.' })
    res.json({ message: 'Password updated successfully.' })
  } catch (error) { console.error(error); res.status(500).json({ message: 'Unable to update password.' }) }
})

app.post('/api/product/barcode', async (req, res) => {
  const rawBarcode = normalizeBarcodeInput(req.body?.barcode || req.body?.code || '')
  if (!/^\d{8,14}$/.test(rawBarcode)) {
    return res.status(400).json({ message: 'Please provide a valid barcode.' })
  }

  const localProduct = sampleProductCatalog.find((product) => product.barcode === rawBarcode)
  if (localProduct) {
    return res.json({ product: productFromCatalog(localProduct), source: 'local-catalog' })
  }

  try {
    const payload = await fetchOpenFoodFacts(`/api/v2/product/${rawBarcode}.json`)
    const productData = payload?.product ? mapOpenFoodFactsProduct(payload.product) : null

    if (!productData) {
      return res.json({
        product: unknownBarcodeProduct(rawBarcode),
        source: 'barcode',
        warning: 'The barcode was detected, but product details are not available yet. Add the product name if you want to search for more details.'
      })
    }

    return res.json({
      product: productData,
      source: 'open-food-facts'
    })
  } catch (error) {
    console.error(error)
    return res.status(503).json({
      message: 'Unable to connect to Open Food Facts. Please check your internet connection and try again.'
    })
  }
})

app.get('/api/product/search', async (req, res) => {
  const query = String(req.query?.query || '').trim()
  const country = normalizeCountry(req.query?.country || 'India')

  if (!query) {
    return res.status(400).json({ message: 'Please enter a product name to search.' })
  }

  try {
    const payload = await fetchOpenFoodFacts('/cgi/search.pl', {
      search_terms: query,
      search_simple: 1,
      action: 'process',
      json: 1,
      countries_tags_en: country.toLowerCase()
    })

    const products = (payload?.products || []).map((product) => mapOpenFoodFactsProduct(product)).filter((product) => product.name)
    if (!products.length) {
      return res.status(404).json({
        message: 'No matching product was found. Try another product name.'
      })
    }

    return res.json({
      query,
      country,
      products,
      source: 'open-food-facts'
    })
  } catch (error) {
    console.error(error)
    return res.status(503).json({
      message: 'Unable to connect to Open Food Facts. Please check your internet connection and try again.'
    })
  }
})

app.post('/api/product/search', async (req, res) => {
  const query = String(req.body?.query || '').trim()
  const country = normalizeCountry(req.body?.country || 'India')

  if (!query) {
    return res.status(400).json({ message: 'Please enter a product name to search.' })
  }

  try {
    const payload = await fetchOpenFoodFacts('/cgi/search.pl', {
      search_terms: query,
      search_simple: 1,
      action: 'process',
      json: 1,
      countries_tags_en: country.toLowerCase()
    })

    const products = (payload?.products || []).map((product) => mapOpenFoodFactsProduct(product)).filter((product) => product.name)
    if (!products.length) {
      return res.status(404).json({
        message: 'No matching product was found. Try another product name.'
      })
    }

    return res.json({
      query,
      country,
      products,
      source: 'open-food-facts'
    })
  } catch (error) {
    console.error(error)
    return res.status(503).json({
      message: 'Unable to connect to Open Food Facts. Please check your internet connection and try again.'
    })
  }
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

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!file || !file.mimetype || !file.mimetype.startsWith('image/')) {
      return callback(new Error('Only JPG, JPEG, PNG images are supported.'))
    }
    callback(null, true)
  }
})

app.post('/api/expiry/detect', upload.array('image', 4), async (req, res) => {
  const imageFiles = req.files || []
  if (!imageFiles.length) {
    return res.status(400).json({ message: 'Expiry date image is required.' })
  }

  try {
    const worker = await createWorker('eng')
    const detections = new Map()

    try {
      for (const imageFile of imageFiles) {
        for (const pageSegmentationMode of ['11', '6']) {
          await worker.setParameters({ tessedit_pageseg_mode: pageSegmentationMode })
          const result = await worker.recognize(imageFile.buffer)
          const expiryDate = extractExpiryDateFromText(result.data?.text || '')
          if (expiryDate) detections.set(expiryDate, (detections.get(expiryDate) || 0) + 1)
        }
      }
    } finally {
      await worker.terminate()
    }

    const expiryDate = [...detections.entries()]
      .sort(([firstDate, firstCount], [secondDate, secondCount]) => secondCount - firstCount || secondDate.localeCompare(firstDate))[0]?.[0] || ''
    if (!expiryDate) {
      return res.status(422).json({
        message: 'Expiry date could not be detected clearly. Please scan again or upload a clearer image.'
      })
    }

    return res.json({
      expiry_date: expiryDate,
      success: true
    })
  } catch (error) {
    console.error(error)
    return res.status(503).json({
      message: 'Unable to read package details. Please try uploading the image again.'
    })
  }
})

app.post('/api/pantry', requireAuth, async (req, res) => {
  const payload = req.body || {}
  const product = payload.product || {}
  const expiryDate = payload.expiryDate || payload.expiry_date || ''

  if (!product.name || !product.barcode) {
    return res.status(400).json({ message: 'Product details are missing.' })
  }

  if (!validDateString(expiryDate)) {
    return res.status(400).json({ message: 'Please provide a valid expiry date.' })
  }

  try {
    const receiptFileName = `barcode-${Date.now()}`
    const [result] = await pool.execute(`INSERT INTO receipt_products
      (user_id, receipt_file_name, product_name, brand, category, barcode, image, source, expiry_date, purchased_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      req.user.id,
      receiptFileName,
      product.name,
      product.brand || null,
      product.category || null,
      product.barcode || null,
      product.image || null,
      'barcode',
      expiryDate,
      new Date().toISOString().slice(0, 10)
    ])

    return res.status(201).json({
      message: 'Item added to Digital Pantry.',
      itemId: result.insertId,
      expiryAlert: expiryStatus(expiryDate)
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Unable to save the pantry item.' })
  }
})

app.get('/api/scanner/barcode/:barcode', async (req, res) => {
  const barcode = String(req.params.barcode || '').replace(/\D/g, '')
  if (!/^\d{8,14}$/.test(barcode)) return res.status(400).json({ message: 'Please provide a valid barcode.' })

  const localProduct = sampleProductCatalog.find((product) => product.barcode === barcode)
  if (localProduct) return res.json({ product: productFromCatalog(localProduct) })
  res.json({
    product: unknownBarcodeProduct(barcode),
    warning: 'Barcode detected. This barcode is not yet in the NutriMatrix product database; packaging OCR will still read its dates and batch number.'
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
      brand, category, barcode, quantity, unit, image, source,
      DATE_FORMAT(manufacturing_date, '%Y-%m-%d') AS manufacturingDate,
      DATE_FORMAT(expiry_date, '%Y-%m-%d') AS expiryDate,
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
        (user_id, receipt_file_name, product_name, brand, category, barcode, quantity, unit, manufacturing_date, image, source, expiry_date, purchased_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        req.user.id, receiptFileName, product.name, product.brand || null, product.category || null, product.barcode || null,
        product.quantity || null, product.unit || null, product.manufacturingDate || null, product.image || null,
        product.source || req.body.source || (receiptFileName === 'Voice input' ? 'voice' : 'receipt'), product.expiryDate || null, purchasedAt
      ])
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

app.get('/api/saved-meals', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT meals FROM saved_meals WHERE user_id = ?', [req.user.id])
    const meals = rows.length ? (typeof rows[0].meals === 'string' ? JSON.parse(rows[0].meals) : rows[0].meals) : []
    res.json({ meals: Array.isArray(meals) ? meals : [] })
  } catch (error) { console.error(error); res.status(500).json({ message: 'Unable to load saved meals.' }) }
})

app.put('/api/saved-meals', requireAuth, async (req, res) => {
  const meals = req.body?.meals
  if (!Array.isArray(meals) || meals.length > 500 || meals.some((meal) => typeof meal !== 'string' || meal.length > 500)) {
    return res.status(400).json({ message: 'Saved meals must be a valid list.' })
  }
  try {
    await pool.execute(`INSERT INTO saved_meals (user_id, meals) VALUES (?, ?)
      ON DUPLICATE KEY UPDATE meals = VALUES(meals)`, [req.user.id, JSON.stringify([...new Set(meals)])])
    res.json({ message: 'Saved meals updated.' })
  } catch (error) { console.error(error); res.status(500).json({ message: 'Unable to save meals.' }) }
})

ensureProfileColumns()
  .then(() => ensureEmailVerificationColumns())
  .then(() => ensurePendingRegistrationsTable())
  .then(() => ensureReceiptProductsTable())
  .then(() => ensureSavedMealsTable())
  .then(() => ensureProductTables())
  .then(() => ensureAdminAccess())
  .then(() => verifySmtpConnection())
  .then(() => app.listen(port, () => console.log(`NutriMatrix API running on http://localhost:${port}`)))
  .catch((error) => {
    console.error('Unable to prepare the nutrition profile table.', error)
    process.exit(1)
  })
