const KEY = 'nutrimatrix-pantry-read-items-v2'
const EVENT = 'nutrimatrix-pantry-read-items-changed'
const idOf = (item) => String(item?.id)
export function loadReadItems() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(parsed) ? [...new Map(parsed.filter((item) => item?.id != null).map((item) => [idOf(item), item])).values()] : []
  } catch { return [] }
}
export function saveReadItems(items) {
  const unique = [...new Map(items.map((item) => [idOf(item), item])).values()]
  localStorage.setItem(KEY, JSON.stringify(unique))
  window.dispatchEvent(new CustomEvent(EVENT, { detail: unique }))
}
export function withoutItem(items, id) { return items.filter((item) => idOf(item) !== String(id)) }
export function addUnique(items, item) { return items.some((entry) => idOf(entry) === idOf(item)) ? items : [...items, item] }
export function mergeUnique(items, additions) { return additions.reduce(addUnique, items) }
export function sameReadItems(left, right) {
  return left.length === right.length && left.every((item, index) => idOf(item) === idOf(right[index]))
}
export function sortPantryItems(items) {
  return [...items].sort((left, right) => {
    const leftDate = left.expiryDate || '9999-12-31'
    const rightDate = right.expiryDate || '9999-12-31'
    return leftDate.localeCompare(rightDate) || Number(left.id) - Number(right.id)
  })
}
export function subscribeToReadItems(callback) {
  const update = (event) => callback(event.detail || loadReadItems())
  const storageUpdate = (event) => { if (event.key === KEY) callback(loadReadItems()) }
  window.addEventListener(EVENT, update)
  window.addEventListener('storage', storageUpdate)
  return () => {
    window.removeEventListener(EVENT, update)
    window.removeEventListener('storage', storageUpdate)
  }
}
