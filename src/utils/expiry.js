export function getExpiryMeta(expiryDate) {
  if (!expiryDate) {
    return {
      daysRemaining: null,
      label: 'No expiry date',
      tone: 'neutral',
      statusKey: 'unknown'
    }
  }

  const today = new Date()
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  const [year, month, day] = String(expiryDate).slice(0, 10).split('-').map(Number)
  const expiryUtc = Date.UTC(year, month - 1, day)
  const daysRemaining = Math.round((expiryUtc - todayUtc) / 86400000)

  if (daysRemaining < 0) {
    return {
      daysRemaining,
      label: 'Expired',
      tone: 'danger',
      statusKey: 'expired'
    }
  }

  if (daysRemaining === 0) {
    return { daysRemaining, label: 'Expires today', tone: 'warning', statusKey: 'today' }
  }

  if (daysRemaining === 1) {
    return { daysRemaining, label: 'Expires tomorrow', tone: 'warning', statusKey: 'tomorrow' }
  }

  if (daysRemaining <= 3) {
    return { daysRemaining, label: 'Expires in 3 days', tone: 'warning', statusKey: 'three' }
  }

  if (daysRemaining <= 7) {
    return { daysRemaining, label: 'Expires in 7 days', tone: 'info', statusKey: 'seven' }
  }

  return { daysRemaining, label: 'Fresh / Safe', tone: 'success', statusKey: 'fresh' }
}

export function getExpirySummary(items = []) {
  return items.reduce((summary, item) => {
    const { statusKey, daysRemaining } = getExpiryMeta(item.expiryDate)

    if (statusKey === 'expired') summary.expired += 1
    if (statusKey === 'today') summary.today += 1
    if (statusKey === 'tomorrow') summary.tomorrow += 1
    if (statusKey === 'three') summary.three += 1
    if (statusKey === 'seven') summary.seven += 1
    if (daysRemaining !== null && daysRemaining > 7) summary.fresh += 1

    return summary
  }, {
    expired: 0,
    today: 0,
    tomorrow: 0,
    three: 0,
    seven: 0,
    fresh: 0
  })
}
