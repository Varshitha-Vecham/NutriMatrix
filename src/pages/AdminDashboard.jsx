import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../api.js'
import { defaultRetailerPriceFor, products as analysisProducts } from './Products.jsx'
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
  ['Deleted Products', '↶'],
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
    setStats({ ...d.stats, products: p.products.filter((product) => product.isActive).length })
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
      prices: retailers.map((retailer) => {
        const savedPrice = p.prices?.find(
          (entry) => entry.retailer?.trim().toLowerCase() === retailer.toLowerCase()
        )
        const defaultPrice = defaultRetailerPriceFor(p, retailer)
        return { retailer, price: savedPrice?.price != null ? String(savedPrice.price) : String(defaultPrice ?? '') }
      }),
    })
    go('Add Product')
  }

  const change = (k, v) => setForm((x) => ({ ...x, [k]: v }))
  const price = (i, v) =>
    setForm((x) => ({
      ...x,
      prices: x.prices.map((p, n) => (n === i ? { ...p, price: v } : p)),
    }))

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
      setMessage('Product deleted from Product Analysis. You can restore it from Product Management.')
    } catch (e) {
      setError(e.message)
    }
  }

  async function restore(id) {
    try {
      await apiRequest(`/api/admin/products/${id}/restore`, { method: 'POST' })
      await load()
      setMessage('Product restored to Product Analysis.')
    } catch (e) {
      setError(e.message)
    }
  }

  async function restoreAll() {
    try {
      await apiRequest('/api/admin/products/restore-all', { method: 'POST' })
      await load()
      setMessage('All deleted products were restored to Product Analysis.')
    } catch (e) {
      setError(e.message)
    }
  }

  async function deleteAll() {
    if (!window.confirm('Permanently delete all deleted products? This cannot be undone.')) return

    try {
      await apiRequest('/api/admin/products/deleted', { method: 'DELETE' })
      await load()
      setMessage('All deleted products were permanently removed.')
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
        {page === 'Product Management' && <ProductList products={products} add={add} edit={edit} remove={remove} onDeletedProducts={() => go('Deleted Products')} />}
        {page === 'Deleted Products' && <DeletedProducts products={products} restore={restore} restoreAll={restoreAll} deleteAll={deleteAll} />}
        {page === 'Add Product' && <Form form={form} editing={editing} change={change} price={price} image={image} save={save} back={() => go('Product Management')} />}
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
            <p>Product additions and edits by administrators.</p>
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

function ProductList({ products, add, edit, remove, onDeletedProducts }) {
  const [search, setSearch] = useState('')
  const activeProducts = products.filter((product) => product.isActive)
  const deletedProducts = products.filter((product) => !product.isActive)
  const query = search.trim().toLowerCase()
  const visibleProducts = activeProducts.filter((product) =>
    `${product.productName} ${product.category}`.toLowerCase().includes(query)
  )

  return (
    <section className="panel">
      <div className="toolbar">
        <div>
          <h2>Product management</h2>
          <p className="muted">{activeProducts.length} active products are published to Product Analysis.</p>
        </div>
        <div className="product-management-actions">
          <button className="primary" onClick={add}>＋ Add New Product</button>
          <button type="button" className="restore-toggle" onClick={onDeletedProducts}>
            {`Restore products${deletedProducts.length ? ` (${deletedProducts.length})` : ''}`}
          </button>
        </div>
      </div>

      <label className="product-management-search">
        <span>Search products</span>
        <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by product name or category" />
      </label>

      <Table heads={['Product', 'Category', 'Calories', 'Protein', 'Carbohydrates', 'Fat', 'BigBasket price', 'Actions']}>
        {visibleProducts.map((p) => (
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
            <td>₹{Number(p.prices?.find((entry) => entry.retailer?.trim().toLowerCase() === 'bigbasket')?.price ?? defaultRetailerPriceFor(p, 'BigBasket')).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
            <td className="actions">
              <button onClick={() => edit(p)}>Edit</button>
              <button className="danger" onClick={() => remove(p.id)}>Delete</button>
            </td>
          </tr>
        ))}
        {!visibleProducts.length && (
          <tr>
            <td colSpan="8" className="empty">{activeProducts.length ? 'No products match your search.' : 'No products yet. Add one to publish it in Product Analysis.'}</td>
          </tr>
        )}
      </Table>
    </section>
  )
}

function DeletedProducts({ products, restore, restoreAll, deleteAll }) {
  const deletedProducts = products.filter((product) => !product.isActive)

  return (
    <section className="panel">
      <div className="toolbar">
        <div>
          <h2>Deleted products</h2>
          <p className="muted">{deletedProducts.length} deleted products are hidden from Product Analysis.</p>
        </div>
        <div className="deleted-product-actions">
          <button type="button" onClick={restoreAll} disabled={!deletedProducts.length}>Restore all</button>
          <button type="button" className="danger" onClick={deleteAll} disabled={!deletedProducts.length}>Delete all</button>
        </div>
      </div>
      {deletedProducts.length ? (
        <Table heads={['Product', 'Category', 'Actions']}>
          {deletedProducts.map((product) => (
            <tr key={product.id}>
              <td><strong>{product.productName}</strong></td>
              <td>{product.category}</td>
              <td className="actions"><button type="button" onClick={() => restore(product.id)}>Restore</button></td>
            </tr>
          ))}
        </Table>
      ) : <p className="muted empty">There are no deleted products.</p>}
    </section>
  )
}

function Form({ form, editing, change, price, image, save, back }) {
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

        <Section title="Retailer prices">
          <p className="muted">Estimated comparison data only.</p>
          <div className="prices">
            {form.prices.map((p, i) => (
              <div key={p.retailer}>
                <strong>{p.retailer}</strong>
                <label>
                  Price (₹)
                  <input min="0" type="number" step=".01" required={p.retailer === 'BigBasket'} value={p.price} onChange={(e) => price(i, e.target.value)} />
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
