import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../api.js'
import { products as analysisProducts } from './Products.jsx'
import './AdminDashboard.css'
import './AdminDashboardOverrides.css'

const categories = ['Grains', 'Pulses', 'Dairy', 'Nuts & Seeds', 'Fruits', 'Vegetables', 'Breakfast Foods', 'Beverages', 'Pantry']
const retailers = ['BigBasket', 'Blinkit', 'Zepto', 'Swiggy Instamart', 'JioMart', 'Amazon Fresh', 'Flipkart Minutes']

const blank = () => ({
  productName: '',
  category: '',
  image: '',
  calories: '',
  protein: '',
  carbohydrates: '',
  fat: '',
  fiber: '',
  sugar: '',
  sodium: '',
  healthBenefits: '',
  healthierAlternatives: [],
  prices: retailers.map((retailer) => ({ retailer, price: '' })),
})

function parseAlternativeIds(value) {
  if (Array.isArray(value)) return value.map(Number).filter(Number.isInteger).slice(0, 3)
  if (typeof value !== 'string' || !value.trim()) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.map(Number).filter(Number.isInteger).slice(0, 3) : []
  } catch {
    return []
  }
}

const nav = [
  ['Dashboard', '▦'],
  ['Product Management', '◈'],
  ['User Management', '♙'],
  ['Admin Profile', '◉'],
]

const Table = ({ heads, children }) => (
  <div className="scroll">
    <table>
      <thead>
        <tr>{heads.map((h) => <th key={h}>{h}</th>)}</tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  </div>
)

const Section = ({ title, children }) => (
  <section className="section">
    <h2>{title}</h2>
    {children}
  </section>
)

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [admin, setAdmin] = useState({ name: 'Admin' })
  const [products, setProducts] = useState([])
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState({ products: 0, users: 0, pantryItems: 0, expiryAlerts: 0 })
  const [activity, setActivity] = useState([])
  const [page, setPage] = useState('Dashboard')
  const [form, setForm] = useState(blank())
  const [editing, setEditing] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const a = await apiRequest('/api/auth/me')

    if (a.user.role !== 'admin') return navigate('/home')

    await apiRequest('/api/admin/products/catalogue', {
      method: 'POST',
      body: JSON.stringify({ products: analysisProducts }),
    })
    const [p, u, d] = await Promise.all([
      apiRequest('/api/admin/products'),
      apiRequest('/api/admin/users'),
      apiRequest('/api/admin/dashboard'),
    ])

    setAdmin(a.user)
    setProducts(p.products)
    setUsers(u.users)
    setStats({ ...d.stats, products: p.products.length })
    setActivity(d.activity)
  }

  useEffect(() => {
    load()
      .catch((e) => {
        if (e.message === 'Not authenticated.') {
          navigate('/admin-login')
          return
        }
        setError(e.message)
      })
      .finally(() => setLoading(false))
  }, [navigate])

  const go = (n) => {
    setPage(n)
    setError('')
    setMessage('')
  }

  const add = () => {
    setEditing(null)
    setForm(blank())
    go('Add Product')
  }

  const edit = (p) => {
    setEditing(p.id)
    setForm({
      ...p,
      healthierAlternatives: parseAlternativeIds(p.healthierAlternatives),
      prices: retailers.map((retailer) => p.prices?.find((x) => x.retailer === retailer) || { retailer, price: '' }),
    })
    go('Add Product')
  }

  const change = (k, v) => setForm((x) => ({ ...x, [k]: v }))
  const price = (i, v) =>
    setForm((x) => ({
      ...x,
      prices: x.prices.map((p, n) => (n === i ? { ...p, price: v } : p)),
    }))

  const createAlternative = async (alternative) => {
    try {
      const result = await apiRequest('/api/admin/products', {
        method: 'POST',
        body: JSON.stringify({ ...alternative, prices: [] }),
      })
      const product = { ...alternative, id: result.id, prices: [] }
      setProducts((current) => [product, ...current])
      setStats((current) => ({ ...current, products: current.products + 1 }))
      setError('')
      return product
    } catch (e) {
      setError(e.message)
      throw e
    }
  }

  const image = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      e.target.value = ''
      setError('Product images must be JPG, PNG or WEBP and smaller than 5 MB. PDF files are not supported.')
      return
    }

    setError('')
    const reader = new FileReader()
    reader.onload = () => change('image', reader.result)
    reader.onerror = () => setError('Unable to read this image. Please choose a valid JPG, PNG or WEBP file.')
    reader.readAsDataURL(file)
  }

  async function save(e) {
    e.preventDefault()

    try {
      const result = await apiRequest(editing ? `/api/admin/products/${editing}` : '/api/admin/products', {
        method: editing ? 'PUT' : 'POST',
        body: JSON.stringify({
          ...form,
          healthierAlternatives: JSON.stringify(form.healthierAlternatives.filter(Boolean).slice(0, 3)),
        }),
      })

      const savedProduct = {
        ...form,
        id: editing || result.id,
        prices: form.prices.filter((entry) => entry.price !== '' && entry.price != null),
      }
      setProducts((current) => editing
        ? current.map((product) => product.id === editing ? savedProduct : product)
        : [savedProduct, ...current])
      if (!editing) setStats((current) => ({ ...current, products: current.products + 1 }))

      let refreshError
      try {
        await load()
      } catch (error) {
        refreshError = error
      }

      go('Product Management')
      setMessage(
        editing
          ? 'Product updated successfully.'
          : 'Product added successfully and is now available in Product Analysis.'
      )
      if (refreshError) setError(`Product saved, but the dashboard could not refresh: ${refreshError.message}`)
    } catch (e) {
      setError(e.message)
    }
  }

  async function remove(id) {
    if (!window.confirm('Are you sure you want to delete this product?')) return

    try {
      await apiRequest(`/api/admin/products/${id}`, { method: 'DELETE' })
      await load()
      setMessage('Product deleted successfully.')
    } catch (e) {
      setError(e.message)
    }
  }

  if (loading) return <div className="admin-loading">Loading secure admin workspace…</div>

  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <button className="brand" onClick={() => go('Dashboard')}>
          Nutri<span>Matrix</span>
          <small>ADMIN PANEL</small>
        </button>

        <nav>
          {nav.map(([name, icon]) => (
            <button
              key={name}
              className={
                page === name || (page === 'Add Product' && name === 'Product Management') ? 'selected' : ''
              }
              onClick={() => go(name)}
            >
              <i>{icon}</i>
              {name}
            </button>
          ))}
        </nav>

        <div className="admin-user">
          <b>NA</b>
          <span>
            <strong>{admin.name}</strong>
            <small>Administrator</small>
          </span>
        </div>

        <button
          className="logout"
          onClick={async () => {
            await apiRequest('/api/auth/logout', { method: 'POST' })
            navigate('/admin-login')
          }}
        >
          ↪ Logout
        </button>
      </aside>

      <main className="admin-main">
        <header>
          <div>
            <p className="kicker">ADMINISTRATOR</p>
            <h1>
              {page === 'Dashboard'
                ? `Welcome, ${admin.name}`
                : page === 'Add Product'
                  ? editing
                    ? 'Edit Product'
                    : 'Add New Product'
                  : page}
            </h1>
            <p>
              {page === 'Dashboard'
                ? 'Live totals and latest workspace activity.'
                : page === 'Product Management'
                  ? 'Products published to Product Analysis.'
                  : 'Manage your NutriMatrix workspace.'}
            </p>
          </div>

          <div className="profile">
            <i>NA</i>
            <span>
              {admin.name}
              <small>Administrator</small>
            </span>
          </div>
        </header>

        {message && <div className="toast success">{message}</div>}
        {error && <div className="toast error">{error}</div>}

        {page === 'Dashboard' && <Overview stats={stats} activity={activity} onProducts={() => go('Product Management')} />}
        {page === 'Product Management' && <ProductList products={products} add={add} edit={edit} remove={remove} />}
        {page === 'Add Product' && <Form form={form} products={products} editing={editing} change={change} price={price} image={image} save={save} createAlternative={createAlternative} back={() => go('Product Management')} />}
        {page === 'User Management' && <Users users={users} />}
        {page === 'Admin Profile' && <Profile admin={admin} setAdmin={setAdmin} notify={setMessage} fail={setError} />}
      </main>
    </div>
  )
}

function Overview({ stats, activity, onProducts }) {
  const cards = [
    ['Total Products', stats.products, '◈'],
    ['Total Users', stats.users, '♙'],
  ]

  return (
    <>
      <section className="cards">
        {cards.map(([label, value, icon]) => (
          <article key={label}>
            <i>{icon}</i>
            <p>{label}</p>
            <strong>{value}</strong>
            <small>Live database total</small>
          </article>
        ))}
      </section>

      <section className="panel">
        <div className="heading">
          <div>
            <h2>Recent activity</h2>
            <p>Latest product changes and registered users.</p>
          </div>
          <button onClick={onProducts}>Manage products →</button>
        </div>

        <Table heads={['Activity', 'Details', 'Date']}>
          {activity.map((x, i) => (
            <tr key={i}>
              <td><strong>{x.activity}</strong></td>
              <td>{x.detail}</td>
              <td>{new Date(x.occurredAt).toLocaleDateString()}</td>
            </tr>
          ))}
          {!activity.length && (
            <tr>
              <td colSpan="3" className="empty">No activity yet.</td>
            </tr>
          )}
        </Table>
      </section>
    </>
  )
}

function ProductList({ products, add, edit, remove }) {
  return (
    <section className="panel">
      <div className="toolbar">
        <div>
          <h2>Product management</h2>
          <p className="muted">All products are shown below.</p>
        </div>
        <button className="primary" onClick={add}>＋ Add New Product</button>
      </div>

      <Table heads={['Product', 'Category', 'Calories', 'Protein', 'Carbohydrates', 'Fat', 'Actions']}>
        {products.map((p) => (
          <tr key={p.id}>
            <td className="product">
              {p.image ? <img src={p.image} alt="" /> : <i>◈</i>}
              <strong>{p.productName}</strong>
            </td>
            <td>{p.category}</td>
            <td>{p.calories || 0} kcal</td>
            <td>{p.protein || 0} g</td>
            <td>{p.carbohydrates || 0} g</td>
            <td>{p.fat || 0} g</td>
            <td className="actions">
              <button onClick={() => edit(p)}>Edit</button>
              <button className="danger" onClick={() => remove(p.id)}>Delete</button>
            </td>
          </tr>
        ))}
        {!products.length && (
          <tr>
            <td colSpan="7" className="empty">No products yet. Add one to publish it in Product Analysis.</td>
          </tr>
        )}
      </Table>
    </section>
  )
}

function Form({ form, products, editing, change, price, image, save, createAlternative, back }) {
  const changeAlternative = (index, productId) => {
    const alternatives = [...form.healthierAlternatives]
    alternatives[index] = productId
    change('healthierAlternatives', alternatives)
  }

  return (
    <>
      <button className="back-button" onClick={back}>← Back to products</button>

      <form onSubmit={save} className="form">
        <Section title="Product information">
          <div className="grid">
            <label>
              Product name
              <input required value={form.productName} onChange={(e) => change('productName', e.target.value)} />
            </label>

            <label>
              Category
              <select required value={form.category} onChange={(e) => change('category', e.target.value)}>
                <option value="">Select category</option>
                {categories.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>

            <label className="upload">
              Product image
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={image} />
              <span>Upload JPG, PNG or WEBP · max 5 MB</span>
              {form.image && (
                <>
                  <img src={form.image} alt="Preview" />
                  <button type="button" onClick={() => change('image', '')}>Remove image</button>
                </>
              )}
            </label>
          </div>
        </Section>

        <Section title="Nutrition information">
          <div className="grid nutrients">
            {[
              ['calories', 'Calories (kcal)'],
              ['protein', 'Protein (g)'],
              ['carbohydrates', 'Carbohydrates (g)'],
              ['fat', 'Fat (g)'],
              ['fiber', 'Fiber (g)'],
              ['sugar', 'Sugar (g)'],
              ['sodium', 'Sodium (mg)'],
            ].map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  min="0"
                  type="number"
                  step="0.1"
                  value={form[key] || ''}
                  onChange={(e) => change(key, e.target.value)}
                />
              </label>
            ))}
          </div>
        </Section>

        <Section title="Health information">
          <div className="grid">
            <label>
              Health benefits
              <textarea value={form.healthBenefits || ''} onChange={(e) => change('healthBenefits', e.target.value)} />
            </label>
          </div>
          <div className="alternative-pickers">
            <p className="muted">Choose up to three products from Product Analysis, or add a missing alternative with its nutrition details.</p>
            {[0, 1, 2].map((index) => (
              <AlternativePicker
                key={index}
                index={index}
                products={products}
                excludedIds={[editing, ...form.healthierAlternatives.filter((id, itemIndex) => itemIndex !== index)]}
                value={form.healthierAlternatives[index] || ''}
                onChange={(productId) => changeAlternative(index, productId)}
                onCreate={createAlternative}
              />
            ))}
          </div>
        </Section>

        <Section title="Retailer prices">
          <p className="muted">Estimated comparison data only.</p>
          <div className="prices">
            {form.prices.map((p, i) => (
              <div key={p.retailer}>
                <strong>{p.retailer}</strong>
                <label>
                  Price (₹)
                  <input min="0" type="number" step=".01" value={p.price} onChange={(e) => price(i, e.target.value)} />
                </label>
              </div>
            ))}
          </div>
        </Section>

        <div className="form-actions">
          <button type="button" onClick={back}>Cancel</button>
          <button className="primary" type="submit">{editing ? 'Save Changes' : 'Add Product'}</button>
        </div>
      </form>
    </>
  )
}

function AlternativePicker({ index, products, excludedIds, value, onChange, onCreate }) {
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [details, setDetails] = useState({
    productName: '',
    category: '',
    calories: '',
    protein: '',
    carbohydrates: '',
    fat: '',
    fiber: '',
    sugar: '',
    sodium: '',
    healthBenefits: '',
  })
  const selected = products.find((product) => String(product.id) === String(value))
  const query = search || selected?.productName || ''
  const normalizedQuery = query.trim().toLowerCase()
  const nameMatches = normalizedQuery
    ? products.filter((product) => product.productName.toLowerCase().includes(normalizedQuery))
    : []
  const matches = selected && !search
    ? []
    : nameMatches.filter((product) =>
        !excludedIds.some((id) => id != null && String(id) === String(product.id))
      ).slice(0, 8)

  const updateDetails = (key, nextValue) => setDetails((current) => ({ ...current, [key]: nextValue }))

  const beginAdding = () => {
    setDetails((current) => ({ ...current, productName: query.trim() }))
    setAdding(true)
  }

  const saveAlternative = async () => {
    setSaving(true)
    try {
      const product = await onCreate(details)
      onChange(product.id)
      setSearch('')
      setAdding(false)
    } catch {
      // The dashboard surfaces the API error in its main error banner.
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="alternative-picker">
      <label htmlFor={`alternative-search-${index}`}>Alternative {index + 1}</label>
      <input
        id={`alternative-search-${index}`}
        type="search"
        value={query}
        onChange={(event) => {
          setSearch(event.target.value)
          setAdding(false)
          onChange('')
        }}
        placeholder="Search Product Analysis products"
        aria-label={`Search healthier alternative ${index + 1}`}
      />
      {!selected && matches.length > 0 && (
        <span className="alternative-suggestions">
          {matches.map((product) => (
            <button
              type="button"
              key={product.id}
              onClick={() => {
                onChange(product.id)
                setSearch('')
                setAdding(false)
              }}
            >
              {product.productName} · {product.category}
            </button>
          ))}
        </span>
      )}
      {!selected && matches.length === 0 && normalizedQuery && !adding && (
        nameMatches.length === 0
          ? <span className="alternative-suggestions">
              <button type="button" onClick={beginAdding}>＋ Add “{query.trim()}” as a new product</button>
            </span>
          : <small>No available matching products.</small>
      )}
      {adding && (
        <div className="alternative-new-product">
          <strong>New alternative product details</strong>
          <label>
            Product name
            <input required value={details.productName} onChange={(event) => updateDetails('productName', event.target.value)} />
          </label>
          <label>
            Category
            <select required value={details.category} onChange={(event) => updateDetails('category', event.target.value)}>
              <option value="">Select category</option>
              {categories.map((category) => <option key={category}>{category}</option>)}
            </select>
          </label>
          <div className="alternative-nutrients">
            {[
              ['calories', 'Calories (kcal)'],
              ['protein', 'Protein (g)'],
              ['carbohydrates', 'Carbohydrates (g)'],
              ['fat', 'Fat (g)'],
              ['fiber', 'Fiber (g)'],
              ['sugar', 'Sugar (g)'],
              ['sodium', 'Sodium (mg)'],
            ].map(([key, label]) => (
              <label key={key}>
                {label}
                <input min="0" type="number" step="0.1" value={details[key]} onChange={(event) => updateDetails(key, event.target.value)} />
              </label>
            ))}
          </div>
          <label>
            Health benefits
            <textarea value={details.healthBenefits} onChange={(event) => updateDetails('healthBenefits', event.target.value)} />
          </label>
          <div className="alternative-new-actions">
            <button type="button" onClick={() => setAdding(false)}>Cancel</button>
            <button type="button" className="primary" disabled={saving || !details.productName.trim() || !details.category} onClick={saveAlternative}>
              {saving ? 'Adding…' : 'Add alternative'}
            </button>
          </div>
        </div>
      )}
      {!query && <small>Optional — choose an existing analysis product.</small>}
    </div>
  )
}

function Users({ users }) {
  const list = users.filter((u) => u.role !== 'admin')

  return (
    <section className="panel">
      <div className="heading">
        <div>
          <h2>User data</h2>
          <p>Registered accounts and saved nutrition-profile details.</p>
        </div>
      </div>

      <Table heads={['User', 'Email', 'Contact', 'Profile details', 'Registered']}>
        {list.map((u) => (
          <tr key={u.id}>
            <td>
              <strong>{u.name}</strong>
              <small>#{u.id}</small>
            </td>
            <td>{u.email}</td>
            <td>{u.phone || 'No phone saved'}</td>
            <td>
              {u.goals || 'Profile not completed'}
              <small>{[u.dietType, u.age && `${u.age} years`, u.gender].filter(Boolean).join(' · ') || '—'}</small>
            </td>
            <td>{new Date(u.createdAt).toLocaleDateString()}</td>
          </tr>
        ))}
        {!list.length && (
          <tr>
            <td colSpan="5" className="empty">No registered users yet.</td>
          </tr>
        )}
      </Table>
    </section>
  )
}

function Profile({ admin, setAdmin, notify, fail }) {
  const [mode, setMode] = useState('')
  const [name, setName] = useState(admin.name)
  const [email, setEmail] = useState(admin.email)

  async function submit(e) {
    e.preventDefault()

    try {
      const data = await apiRequest('/api/admin/profile', {
        method: 'PUT',
        body: JSON.stringify({ name, email }),
      })

      if (data.user) {
        setAdmin(data.user)
        setName(data.user.name)
        setEmail(data.user.email)
      }
      notify(data.message)
      setMode('')
    } catch (e) {
      fail(e.message)
    }
  }

  return (
    <section className="profile-card">
      <b>NA</b>
      <h2>{admin.name}</h2>
      <p>{admin.email}</p>

      <dl>
        <div>
          <dt>Account role</dt>
          <dd>Administrator</dd>
        </div>
        <div>
          <dt>Last login</dt>
          <dd>Current session</dd>
        </div>
      </dl>

      {!mode ? (
        <div className="form-actions">
          <button onClick={() => setMode('edit')}>Edit Profile</button>
        </div>
      ) : (
        <form className="profile-form" onSubmit={submit}>
          <label>
            Name <input required value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            Email <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>

          <div className="form-actions">
            <button type="button" onClick={() => setMode('')}>Cancel</button>
            <button className="primary">Save</button>
          </div>
        </form>
      )}
    </section>
  )
}
