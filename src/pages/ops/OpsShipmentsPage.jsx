import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import StatusBadge from '../../components/StatusBadge'
import { slmsApi } from '../../api/slmsApi'
import { getErrorMessage } from '../../utils/apiHelpers'

export default function OpsShipmentsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialOrderId = searchParams.get('orderId') || ''

  const [orderId, setOrderId] = useState(initialOrderId)
  const [shipment, setShipment] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)

  const loadShipment = async (targetOrderId) => {
    if (!targetOrderId) {
      return
    }

    setError('')
    setNotice('')
    setLoading(true)

    try {
      const payload = await slmsApi.getShipmentByOrderId(targetOrderId)
      setShipment(payload)
    } catch (searchError) {
      setShipment(null)
      setError(getErrorMessage(searchError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialOrderId) {
      setOrderId(initialOrderId)
      loadShipment(initialOrderId)
    }
  }, [initialOrderId])

  const onSearch = async (event) => {
    event.preventDefault()
    const trimmed = orderId.trim()
    setSearchParams(trimmed ? { orderId: trimmed } : {})
    await loadShipment(trimmed)
  }

  return (
    <section className="panel reveal">
      <p className="eyebrow">Ops Shipments</p>
      <h2>Track shipment</h2>

      <form className="inline-form-row" onSubmit={onSearch}>
        <label>
          Order ID
          <input
            placeholder="ORD-..."
            value={orderId}
            onChange={(event) => setOrderId(event.target.value)}
            required
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Loading...' : 'Find shipment'}
        </button>
      </form>

      {notice && <p className="inline-success">{notice}</p>}
      {error && <p className="inline-error">{error}</p>}

      {shipment && (
        <div className="sub-panel">
          <p>
            Current status: <StatusBadge status={shipment.status} />
          </p>
          <p className="muted">Status is driven by order fulfillment updates.</p>
        </div>
      )}
    </section>
  )
}
