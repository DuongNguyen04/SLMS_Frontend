import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Pagination from '../../components/Pagination'
import StatusBadge from '../../components/StatusBadge'
import { ORDER_STATUSES } from '../../constants/roles'
import { slmsApi } from '../../api/slmsApi'
import { getErrorMessage, normalizePage } from '../../utils/apiHelpers'
import { formatCurrency } from '../../utils/format'

const PAGE_SIZE = 10

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [pageData, setPageData] = useState(() => normalizePage(null, 0, PAGE_SIZE))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [searchOrderId, setSearchOrderId] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [isSearchActive, setIsSearchActive] = useState(false)

  const fetchOrders = useCallback(async (page = 0, status = statusFilter) => {
    setLoading(true)
    setError('')

    try {
      const payload = await slmsApi.listOrders({
        page,
        size: PAGE_SIZE,
        status: status || undefined,
      })
      setPageData(payload)
    } catch (fetchError) {
      setError(getErrorMessage(fetchError))
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    if (!isSearchActive) {
      fetchOrders(0, statusFilter)
    }
  }, [fetchOrders, statusFilter, isSearchActive])

  const onStatusFilterChange = (event) => {
    const nextValue = event.target.value
    setStatusFilter(nextValue)
    if (isSearchActive) {
      setIsSearchActive(false)
      setSearchOrderId('')
    }
  }

  const onSearch = async (event) => {
    event.preventDefault()
    const trimmed = searchOrderId.trim()

    if (!trimmed) {
      setIsSearchActive(false)
      await fetchOrders(0, statusFilter)
      return
    }

    setIsSearching(true)
    setError('')
    setNotice('')

    try {
      const payload = await slmsApi.getOrderDetail(trimmed)
      setPageData(normalizePage({
        content: [payload],
        number: 0,
        size: 1,
        totalElements: 1,
        totalPages: 1,
      }, 0, PAGE_SIZE))
      setIsSearchActive(true)
    } catch (searchError) {
      setPageData(normalizePage(null, 0, PAGE_SIZE))
      setIsSearchActive(true)
      setError(getErrorMessage(searchError))
    } finally {
      setIsSearching(false)
    }
  }

  const clearSearch = async () => {
    setSearchOrderId('')
    setIsSearchActive(false)
    await fetchOrders(0, statusFilter)
  }

  const onCancel = async (orderId) => {
    setError('')
    setNotice('')

    try {
      await slmsApi.cancelOrder(orderId)
      setNotice(`Order ${orderId} cancelled.`)
      await fetchOrders(pageData.number, statusFilter)
    } catch (cancelError) {
      setError(getErrorMessage(cancelError))
    }
  }

  return (
    <section className="panel reveal">
      <div className="section-head">
        <div>
          <p className="eyebrow">My Orders</p>
          <h2>Order history and status</h2>
        </div>
        <label className="compact-filter">
          Filter status
          <select value={statusFilter} onChange={onStatusFilterChange}>
            <option value="">All</option>
            {ORDER_STATUSES.map((status) => (
              <option value={status} key={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
      </div>

      <form className="inline-form-row" onSubmit={onSearch}>
        <label>
          Order ID
          <input
            value={searchOrderId}
            onChange={(event) => setSearchOrderId(event.target.value)}
            placeholder="ORD-..."
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={isSearching}>
          {isSearching ? 'Searching...' : 'Search'}
        </button>
        {isSearchActive && (
          <button type="button" className="btn btn-ghost" onClick={clearSearch}>
            Clear search
          </button>
        )}
      </form>

      {notice && <p className="inline-success">{notice}</p>}
      {error && <p className="inline-error">{error}</p>}

      {loading ? (
        <div className="loading-panel">Loading orders...</div>
      ) : pageData.content.length === 0 ? (
        <div className="empty-panel">
          <h3>{isSearchActive ? 'No matching order' : 'No orders yet'}</h3>
          <p>
            {isSearchActive
              ? 'Try a different order ID or clear search to see all orders.'
              : 'Checkout at least one cart item to see history here.'}
          </p>
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageData.content.map((order) => (
                  <tr key={order.orderId}>
                    <td>{order.orderId}</td>
                    <td>{formatCurrency(order.totalPrice)}</td>
                    <td>
                      <StatusBadge status={order.status} />
                    </td>
                    <td>
                      <div className="button-row compact">
                        <Link className="btn btn-ghost" to={`/shop/orders/${encodeURIComponent(order.orderId)}`}>
                          Details
                        </Link>
                        {order.status === 'PENDING' && (
                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() => onCancel(order.orderId)}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!isSearchActive && (
            <Pagination pageData={pageData} onPageChange={(page) => fetchOrders(page, statusFilter)} />
          )}
        </>
      )}
    </section>
  )
}
