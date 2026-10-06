// OCR-focused expiry-date detector, adapted from the supplied implementation.
// Dates are returned as YYYY-MM-DD because that is the API and database format.
const MONTHS = {
  JAN: 1, JANUARY: 1, FEB: 2, FEBRUARY: 2, MAR: 3, MARCH: 3,
  APR: 4, APRIL: 4, MAY: 5, JUN: 6, JUNE: 6, JUL: 7, JULY: 7,
  AUG: 8, AUGUST: 8, SEP: 9, SEPT: 9, SEPTEMBER: 9, OCT: 10,
  OCTOBER: 10, NOV: 11, NOVEMBER: 11, DEC: 12, DECEMBER: 12
}

const MONTH_PATTERN = 'JAN(?:UARY)?|FEB(?:RUARY)?|MAR(?:CH)?|APR(?:IL)?|MAY|JUN(?:E)?|JUL(?:Y)?|AUG(?:UST)?|SEP(?:T(?:EMBER)?)?|OCT(?:OBER)?|NOV(?:EMBER)?|DEC(?:EMBER)?'
const EXPIRY_LABEL = /(EXPIRY|EXP|EXP\.|EXPIRATION|USE\s*BY|BEST\s*BEFORE)/i

export function validDateString(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

function normalizeYear(year) {
  const numericYear = Number.parseInt(year, 10)
  return numericYear < 100 ? (numericYear <= 50 ? 2000 + numericYear : 1900 + numericYear) : numericYear
}

function formatDate(day, month, year) {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function isValidDate(day, month, year) {
  return Number.isInteger(day) && Number.isInteger(month) && Number.isInteger(year) && validDateString(formatDate(day, month, year))
}

function addMonths(dateValue, months) {
  const [year, month, day] = dateValue.split('-').map(Number)
  const monthIndex = month - 1 + months
  const targetYear = year + Math.floor(monthIndex / 12)
  const targetMonth = monthIndex % 12
  const targetDay = Math.min(day, new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate())
  return formatDate(targetDay, targetMonth + 1, targetYear)
}

export function extractExpiryDateFromText(text) {
  if (!text || typeof text !== 'string') return ''

  let normalizedText = text
    .replace(/\r/g, '\n')
    .replace(/[|]/g, 'I')
    .replace(/[“”"']/g, '')
    .replace(/[—–−]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()

  normalizedText = normalizedText
    .replace(/(?<=\d)[Oo](?=\d)/g, '0')
    .replace(/(?<=\d)[Il](?=\d)/g, '1')
    .replace(/(?<=\d)[Ss](?=\d)/g, '5')
    .replace(/\bEXPlRY\b/gi, 'EXPIRY')
    .replace(/\bEXPIR[YX]\b/gi, 'EXPIRY')
    .replace(/\bEXP[RlI]Y\b/gi, 'EXPIRY')
    .replace(/\bEXP\s*DATE\b/gi, 'EXP')
    .replace(/\bBEST\s*BEFORE\b/gi, 'BEST BEFORE')
    .replace(/\bUSE\s*BY\b/gi, 'USE BY')

  const candidates = []
  const addCandidate = (day, month, year, score, source) => {
    const normalizedYear = normalizeYear(year)
    if (isValidDate(day, month, normalizedYear)) {
      candidates.push({ date: formatDate(day, month, normalizedYear), score, source })
    }
  }

  const labelMatch = normalizedText.match(EXPIRY_LABEL)
  let hasInvalidLabeledDate = false
  if (labelMatch) {
    const afterLabel = normalizedText.substring(labelMatch.index || 0, (labelMatch.index || 0) + 80)
    let match = afterLabel.match(/\b(\d{1,2})\s*[/.\-]\s*(\d{1,2})\s*[/.\-]\s*(\d{2,4})\b/)
    if (match) {
      const candidateCount = candidates.length
      addCandidate(Number(match[1]), Number(match[2]), Number(match[3]), 100, 'expiry label')
      hasInvalidLabeledDate = candidates.length === candidateCount
    }

    match = afterLabel.match(/\b(20\d{2})\s*[/.\-]\s*(\d{1,2})\s*[/.\-]\s*(\d{1,2})\b/)
    if (match) addCandidate(Number(match[3]), Number(match[2]), Number(match[1]), 100, 'expiry label')

    match = afterLabel.match(/\b(\d{2})(\d{2})(\d{2,4})\b/)
    if (match) addCandidate(Number(match[1]), Number(match[2]), Number(match[3]), 95, 'expiry label compact')

    match = afterLabel.match(new RegExp(`\\b(${MONTH_PATTERN})\\s*[\\/\\- ]\\s*(\\d{2,4})\\b`, 'i'))
    if (match) {
      const month = MONTHS[match[1].toUpperCase()]
      const year = normalizeYear(match[2])
      if (month) addCandidate(new Date(year, month, 0).getDate(), month, year, 90, 'expiry month-year')
    }
  }

  const dateRegex = /\b(\d{1,2})\s*[/.\-]\s*(\d{1,2})\s*[/.\-]\s*(\d{2,4})\b/g
  for (const match of normalizedText.matchAll(dateRegex)) {
    let score = 50
    const nearbyText = normalizedText.substring(Math.max(0, match.index - 30), Math.min(normalizedText.length, match.index + 30))
    if (EXPIRY_LABEL.test(nearbyText)) score += 40
    if (/(MFD|MFG|MANUFACTURED|MANUFACTURING)/i.test(nearbyText)) score -= 30
    addCandidate(Number(match[1]), Number(match[2]), Number(match[3]), score, 'general date')
  }

  const compactRegex = /\b(\d{2})(\d{2})(\d{2}|\d{4})\b/g
  for (const match of normalizedText.matchAll(compactRegex)) {
    addCandidate(Number(match[1]), Number(match[2]), Number(match[3]), 40, 'compact date')
  }

  const monthYearRegex = new RegExp(`\\b(${MONTH_PATTERN})\\s*[\\/\\- ]\\s*(\\d{2,4})\\b`, 'gi')
  for (const match of normalizedText.matchAll(monthYearRegex)) {
    const month = MONTHS[match[1].toUpperCase()]
    if (!month) continue
    const year = normalizeYear(match[2])
    let score = 35
    const nearbyText = normalizedText.substring(Math.max(0, match.index - 25), Math.min(normalizedText.length, match.index + 40))
    if (EXPIRY_LABEL.test(nearbyText)) score += 50
    addCandidate(new Date(year, month, 0).getDate(), month, year, score, 'month-year')
  }

  const bestBeforePeriod = normalizedText.match(/\bBEST\s*BEFORE\s*(\d{1,3})\s*(?:months?|mnths?)\b/i)
  if (bestBeforePeriod) {
    const manufacturingMatch = normalizedText.match(/\b(?:MFD|MFG|MANUFACTURED|MANUFACTURING)\b[^\d]*(\d{1,2})\s*[/.\-]\s*(\d{1,2})\s*[/.\-]\s*(\d{2,4})\b/i)
    if (manufacturingMatch) {
      const year = normalizeYear(manufacturingMatch[3])
      const date = formatDate(Number(manufacturingMatch[1]), Number(manufacturingMatch[2]), year)
      if (validDateString(date)) return addMonths(date, Number(bestBeforePeriod[1]))
    }
  }

  if (hasInvalidLabeledDate) return ''

  const uniqueCandidates = []
  for (const candidate of candidates) {
    const existing = uniqueCandidates.find((item) => item.date === candidate.date)
    if (!existing) uniqueCandidates.push(candidate)
    else if (candidate.score > existing.score) Object.assign(existing, candidate)
  }

  // A lone, unlabelled date is ambiguous (often a manufacturing date or batch code).
  if (!labelMatch && uniqueCandidates.length < 2) return ''

  uniqueCandidates.sort((first, second) => second.score - first.score || second.date.localeCompare(first.date))
  return uniqueCandidates[0]?.date || ''
}
