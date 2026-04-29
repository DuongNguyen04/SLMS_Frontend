export function getErrorMessage(error) {
  if (!error) {
    return 'Unexpected error. Please try again.'
  }

  if (typeof error === 'string') {
    return error
  }

  if (error.message) {
    return error.message
  }

  return 'Unexpected error. Please try again.'
}

export function normalizePage(payload, fallbackPage = 0, fallbackSize = 20) {
  return {
    content: payload?.content ?? [],
    number: payload?.number ?? fallbackPage,
    size: payload?.size ?? fallbackSize,
    totalElements: payload?.totalElements ?? 0,
    totalPages: payload?.totalPages ?? 0,
  }
}
