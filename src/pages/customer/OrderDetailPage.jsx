import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import StatusBadge from '../../components/StatusBadge'
import { slmsApi } from '../../api/slmsApi'
import { getErrorMessage } from '../../utils/apiHelpers'
import { formatCurrency } from '../../utils/format'

const PRODUCT_IMAGE_FALLBACK = 'https://picsum.photos/seed/slms-order-detail-fallback/240/180'

export default function OrderDetailPage() {
  const { orderId } = useParams()
  const decodedOrderId = decodeURIComponent(orderId)
  const navigate = useNavigate()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setError('')

      try {
        const payload = await slmsApi.getOrderDetail(decodedOrderId)
        setOrder(payload)
      } catch (fetchError) {
        setError(getErrorMessage(fetchError))
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [decodedOrderId])

  const cancelOrder = async () => {
    setError('')
    setNotice('')

    try {
      const payload = await slmsApi.cancelOrder(decodedOrderId)
      setOrder(payload)
      setNotice(`Order ${decodedOrderId} cancelled.`)
    } catch (cancelError) {
      setError(getErrorMessage(cancelError))
    }
  }

  if (loading) {
    return <div className="panel loading-panel">Loading order detail...</div>
  }

  if (!order) {
    return (
      <div className="panel empty-panel">
        <h3>Order not found</h3>
        <p>{error || 'Unable to load order detail.'}</p>
        <button type="button" className="btn btn-ghost" onClick={() => navigate('/shop/orders')}>
          Back to orders
        </button>
      </div>
    )
  }

  return (
    <section className="panel reveal">
      <div className="section-head">
        <div>
          <p className="eyebrow">Order detail</p>
          <h2>{order.orderId}</h2>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {notice && <p className="inline-success">{notice}</p>}
      {error && <p className="inline-error">{error}</p>}

      <p className="muted">Total: {formatCurrency(order.totalPrice)}</p>
      {order.shippingAddress && (
        <p className="muted">Shipping address: {order.shippingAddress}</p>
      )}
      {order.phoneNumber && (
        <p className="muted">Phone: {order.phoneNumber}</p>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Image</th>
              <th>Product</th>
              <th>Quantity</th>
              <th>Unit price</th>
            </tr>
          </thead>
          <tbody>
            {(order.items || []).map((item) => (
              <tr key={item.productName}>
                <td>
                  <div className="table-product-media">
                    <img
                      className="table-product-image"
                      src={item.imageUrl || PRODUCT_IMAGE_FALLBACK}
                      alt={`Image for ${item.productName}`}
                      loading="lazy"
                    />
                  </div>
                </td>
                <td>{item.productName}</td>
                <td>{item.quantity}</td>
                <td>{formatCurrency(item.unitPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {order.shipment && (
        <div className="sub-panel">
          <h3>Shipment tracking</h3>
          <p>
            Status: <StatusBadge status={order.shipment.status} />
          </p>
          <p>Current location: {order.shipment.currentLocation}</p>
        </div>
      )}

      <div className="button-row">
        <button type="button" className="btn btn-ghost" onClick={() => navigate('/shop/orders')}>
          Back to orders
        </button>
        {order.status === 'PENDING' && (
          <button type="button" className="btn btn-danger" onClick={cancelOrder}>
            Cancel order
          </button>
        )}
      </div>
    </section>
  )
}
