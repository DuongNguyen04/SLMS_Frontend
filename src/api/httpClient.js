export class ApiError extends Error {
  constructor(status, errorCode, message, details = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errorCode = errorCode
    this.details = details
  }
}

let getToken = () => null
let onUnauthorized = () => {}

export function configureHttpClient(options = {}) {
  if (typeof options.getToken === 'function') {
    getToken = options.getToken
  }

  if (typeof options.onUnauthorized === 'function') {
    onUnauthorized = options.onUnauthorized
  }
}

function buildUrl(path, query) {
  if (!query) {
    return path
  }

  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value)
    }
  })

  const queryString = params.toString()
  return queryString ? `${path}?${queryString}` : path
}

async function readResponseBody(response) {
  if (response.status === 204) {
    return null
  }

  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return response.json()
  }

  const text = await response.text()
  return text || null
}

export async function httpRequest(path, options = {}) {
  const {
    method = 'GET',
    query,
    body,
    headers = {},
    skipAuth = false,
  } = options

  const isFormData =
    body && typeof FormData !== 'undefined' && body instanceof FormData

  const requestHeaders = {
    Accept: 'application/json',
    ...headers,
  }

  if (body !== undefined && body !== null && !isFormData) {
    requestHeaders['Content-Type'] = 'application/json'
  }

  if (!skipAuth) {
    const token = getToken()
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`
    }
  }

  const response = await fetch(buildUrl(path, query), {
    method,
    headers: requestHeaders,
    body:
      body !== undefined && body !== null
        ? isFormData
          ? body
          : JSON.stringify(body)
        : undefined,
  })

  const payload = await readResponseBody(response)

  if (!response.ok) {
    if (response.status === 401) {
      onUnauthorized()
    }

    const message =
      (payload && typeof payload === 'object' && payload.message) ||
      response.statusText ||
      'Request failed'

    const details =
      payload && typeof payload === 'object' && Array.isArray(payload.details)
        ? payload.details
        : []

    const errorCode =
      payload && typeof payload === 'object' && payload.error
        ? payload.error
        : 'HTTP_ERROR'

    throw new ApiError(response.status, errorCode, message, details)
  }

  return payload
}

export async function httpDownload(path, options = {}) {
  const {
    method = 'GET',
    query,
    headers = {},
    skipAuth = false,
  } = options

  const requestHeaders = {
    Accept: '*/*',
    ...headers,
  }

  if (!skipAuth) {
    const token = getToken()
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`
    }
  }

  const response = await fetch(buildUrl(path, query), {
    method,
    headers: requestHeaders,
  })

  if (!response.ok) {
    const payload = await readResponseBody(response)
    if (response.status === 401) {
      onUnauthorized()
    }

    const message =
      (payload && typeof payload === 'object' && payload.message) ||
      response.statusText ||
      'Request failed'

    const details =
      payload && typeof payload === 'object' && Array.isArray(payload.details)
        ? payload.details
        : []

    const errorCode =
      payload && typeof payload === 'object' && payload.error
        ? payload.error
        : 'HTTP_ERROR'

    throw new ApiError(response.status, errorCode, message, details)
  }

  return response.blob()
}
