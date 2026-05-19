import { ApiError, httpRequest, httpDownload } from './httpClient'
import { normalizePage } from '../utils/apiHelpers'

async function emptyOnNotFoundPage(fetcher, fallbackPage = 0, fallbackSize = 20) {
  try {
    const payload = await fetcher()
    return normalizePage(payload, fallbackPage, fallbackSize)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return normalizePage(null, fallbackPage, fallbackSize)
    }
    throw error
  }
}

async function emptyOnNotFound(fetcher, fallbackValue) {
  try {
    return await fetcher()
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return fallbackValue
    }
    throw error
  }
}

export const slmsApi = {
  register: (payload) =>
    httpRequest('/api/auth/register', {
      method: 'POST',
      body: payload,
      skipAuth: true,
    }),

  login: (payload) =>
    httpRequest('/api/auth/login', {
      method: 'POST',
      body: payload,
      skipAuth: true,
    }),

  listProducts: ({ page = 0, size = 8, keyword, minPrice, maxPrice } = {}) =>
    emptyOnNotFoundPage(
      () =>
        httpRequest('/api/products', {
          query: { page, size, keyword, minPrice, maxPrice },
        }),
      page,
      size,
    ),

  getProductByName: (name) =>
    httpRequest(`/api/products/${encodeURIComponent(name)}`),

  createProduct: (payload) =>
    httpRequest('/api/products', {
      method: 'POST',
      body: payload,
    }),

  updateProduct: (name, payload) =>
    httpRequest(`/api/products/${encodeURIComponent(name)}`, {
      method: 'PUT',
      body: payload,
    }),

  deleteProduct: (name) =>
    httpRequest(`/api/products/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    }),

  getMyCart: () => emptyOnNotFound(() => httpRequest('/api/carts/me'), null),

  addCartItem: (payload) =>
    httpRequest('/api/carts/me/items', {
      method: 'POST',
      body: payload,
    }),

  updateCartItem: (productName, payload) =>
    httpRequest(`/api/carts/me/items/${encodeURIComponent(productName)}`, {
      method: 'PUT',
      body: payload,
    }),

  removeCartItem: (productName) =>
    httpRequest(`/api/carts/me/items/${encodeURIComponent(productName)}`, {
      method: 'DELETE',
    }),

  clearCart: () =>
    httpRequest('/api/carts/me/items', {
      method: 'DELETE',
    }),

  placeOrder: (payload = {}) =>
    httpRequest('/api/orders', {
      method: 'POST',
      body: payload,
    }),

  listOrders: ({ page = 0, size = 20, status } = {}) =>
    emptyOnNotFoundPage(
      () =>
        httpRequest('/api/orders', {
          query: { page, size, status },
        }),
      page,
      size,
    ),

  getOrderDetail: (orderId) =>
    httpRequest(`/api/orders/${encodeURIComponent(orderId)}`),

  cancelOrder: (orderId) =>
    httpRequest(`/api/orders/${encodeURIComponent(orderId)}/cancel`, {
      method: 'POST',
      body: {},
    }),

  updateOrderStatus: (orderId, payload) =>
    httpRequest(`/api/orders/${encodeURIComponent(orderId)}/status`, {
      method: 'PATCH',
      body: payload,
    }),

  getShipmentByOrderId: (orderId) =>
    httpRequest(`/api/shipments/${encodeURIComponent(orderId)}`),

  updateShipment: (orderId, payload) =>
    httpRequest(`/api/shipments/${encodeURIComponent(orderId)}`, {
      method: 'PATCH',
      body: payload,
    }),

  listInventory: ({ page = 0, size = 20, keyword } = {}) =>
    emptyOnNotFoundPage(
      () =>
        httpRequest('/api/inventory', {
          query: { page, size, keyword },
        }),
      page,
      size,
    ),

  adjustStock: (productName, payload) =>
    httpRequest(`/api/inventory/${encodeURIComponent(productName)}`, {
      method: 'PATCH',
      body: payload,
    }),

  listUsers: ({ page = 0, size = 20 } = {}) =>
    emptyOnNotFoundPage(
      () =>
        httpRequest('/api/users', {
          query: { page, size },
        }),
      page,
      size,
    ),

  createUser: (payload) =>
    httpRequest('/api/users', {
      method: 'POST',
      body: payload,
    }),

  updateUser: (username, payload) =>
    httpRequest(`/api/users/${encodeURIComponent(username)}`, {
      method: 'PUT',
      body: payload,
    }),

  deleteUser: (username) =>
    httpRequest(`/api/users/${encodeURIComponent(username)}`, {
      method: 'DELETE',
    }),

  assignRole: (username, role) =>
    httpRequest(`/api/users/${encodeURIComponent(username)}/role`, {
      method: 'PATCH',
      body: { role },
    }),

  generateSalesReport: ({ startDate, endDate, format = 'PDF' } = {}) =>
    httpRequest('/api/reports/sales', {
      query: { startDate, endDate, format },
    }),

  generateInventoryReport: ({ startDate, endDate, format = 'PDF' } = {}) =>
    httpRequest('/api/reports/inventory', {
      query: { startDate, endDate, format },
    }),

  downloadReport: (fileName) =>
    httpDownload(`/api/reports/files/${encodeURIComponent(fileName)}`),

  scheduleBatchJob: (payload) =>
    httpRequest('/api/batch/jobs/schedule', {
      method: 'POST',
      body: payload,
    }),

  runBatchJob: (payload) =>
    httpRequest('/api/batch/jobs/run', {
      method: 'POST',
      body: payload,
    }),

  retryBatchJob: (payload) =>
    httpRequest('/api/batch/jobs/retry', {
      method: 'POST',
      body: payload,
    }),

  uploadImportProducts: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return httpRequest('/api/batch/jobs/import/upload', {
      method: 'POST',
      body: formData,
    })
  },

  listBatchLogs: ({ page = 0, size = 20, jobType } = {}) =>
    emptyOnNotFoundPage(
      () =>
        httpRequest('/api/batch/logs', {
          query: { page, size, jobType },
        }),
      page,
      size,
    ),
}
