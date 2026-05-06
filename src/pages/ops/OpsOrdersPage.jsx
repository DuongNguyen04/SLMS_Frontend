import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Pagination from '../../components/Pagination'
import StatusBadge from '../../components/StatusBadge'
import { ORDER_STATUSES } from '../../constants/roles'
import { slmsApi } from '../../api/slmsApi'
import { getErrorMessage, normalizePage } from '../../utils/apiHelpers'
import { formatCurrency } from '../../utils/format'

const PAGE_SIZE = 10

function nextStatuses(currentStatus) {
  if (currentStatus === 'PENDING') return ['CONFIRMED', 'CANCELLED']
  if (currentStatus === 'CONFIRMED') return ['SHIPPED', 'CANCELLED']
  if (currentStatus === 'SHIPPED') return ['DELIVERED']
  return []
}

export default function OpsOrdersPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [pageData, setPageData] = useState(() => normalizePage(null, 0, PAGE_SIZE))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

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
    fetchOrders(0, statusFilter)
  }, [fetchOrders, statusFilter])

  const onUpdateStatus = async (orderId, status) => {
    setError('')
    setNotice('')

    try {
      await slmsApi.updateOrderStatus(orderId, { status })
      setNotice(`Order ${orderId} moved to ${status}.`)
      await fetchOrders(pageData.number, statusFilter)
    } catch (updateError) {
      setError(getErrorMessage(updateError))
    }
  }

  return (
    <section className="panel reveal">
      <div className="section-head">
        <div>
          <p className="eyebrow">Ops Orders</p>
          <h2>Fulfillment queue</h2>
        </div>
        <label className="compact-filter">
          Filter status
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All</option>
            {ORDER_STATUSES.map((status) => (
              <option value={status} key={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
      </div>

      {notice && <p className="inline-success">{notice}</p>}
      {error && <p className="inline-error">{error}</p>}

      {loading ? (
        <p className="loading-panel">Loading orders...</p>
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Details</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pageData.content.map((order) => {
                  const availableTransitions = nextStatuses(order.status)

                  return (
                    <tr key={order.orderId}>
                      <td>{order.orderId}</td>
                      <td>{order.customerUsername}</td>
                      <td>{formatCurrency(order.totalPrice)}</td>
                      <td>
                        <StatusBadge status={order.status} />
                      </td>
                      <td>
                        <Link className="btn btn-ghost" to={`/ops/orders/${encodeURIComponent(order.orderId)}`}>
                          Details
                        </Link>
                      </td>
                      <td>
                        {availableTransitions.length === 0 ? (
                          <span className="muted">No action</span>
                        ) : (
                          <div className="button-row compact">
                            {availableTransitions.map((status) => (
                              <button
                                type="button"
                                className={status === 'CANCELLED' ? 'btn btn-danger' : 'btn btn-primary'}
                                key={status}
                                onClick={() => onUpdateStatus(order.orderId, status)}
                              >
                                {status === 'CANCELLED' ? 'Cancel order' : `Mark ${status}`}
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <Pagination pageData={pageData} onPageChange={(page) => fetchOrders(page, statusFilter)} />
        </>
      )}
    </section>
  )
}
