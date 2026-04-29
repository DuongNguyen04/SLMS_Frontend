const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
})

export function formatCurrency(value) {
  const numberValue = Number(value)
  if (Number.isNaN(numberValue)) {
    return currencyFormatter.format(0)
  }

  return currencyFormatter.format(numberValue)
}

export function formatDateTime(value) {
  if (!value) {
    return '-'
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function toSentenceCase(text) {
  if (!text) {
    return ''
  }

  return text
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}
