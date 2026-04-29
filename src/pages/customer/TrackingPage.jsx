import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import StatusBadge from '../../components/StatusBadge'
import { slmsApi } from '../../api/slmsApi'
import { getErrorMessage } from '../../utils/apiHelpers'

const TRACKING_STEPS = ['CREATED', 'IN_TRANSIT', 'DELIVERED']

export default function TrackingPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialOrderId = searchParams.get('orderId') || ''

  const [orderId, setOrderId] = useState(initialOrderId)
  const [shipment, setShipment] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const loadShipment = async (targetOrderId) => {
    if (!targetOrderId) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const payload = await slmsApi.getShipmentByOrderId(targetOrderId)
      setShipment(payload)
    } catch (loadError) {
      setShipment(null)
      setError(getErrorMessage(loadError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialOrderId) {
      loadShipment(initialOrderId)
    }
  }, [initialOrderId])

  const onSubmit = (event) => {
    event.preventDefault()
    const trimmed = orderId.trim()
    setSearchParams(trimmed ? { orderId: trimmed } : {})
    loadShipment(trimmed)
  }

  return (
    <section className="panel reveal">
      <p className="eyebrow">Shipment tracking</p>
      <h2>Track your delivery</h2>

      <form className="inline-form-row" onSubmit={onSubmit}>
        <label>
          Order ID
          <input
            value={orderId}
            onChange={(event) => setOrderId(event.target.value)}
            placeholder="ORD-..."
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Tracking...' : 'Track'}
        </button>
      </form>

      {error && <p className="inline-error">{error}</p>}

      {shipment && (
        <div className="sub-panel">
          <p>
            Current status: <StatusBadge status={shipment.status} />
          </p>
          <p>Current location: {shipment.currentLocation}</p>

          <div className="tracking-rail">
            {TRACKING_STEPS.map((step) => {
              const currentIndex = TRACKING_STEPS.indexOf(shipment.status)
              const stepIndex = TRACKING_STEPS.indexOf(step)
              const reached = stepIndex <= currentIndex

              return (
                <div className={reached ? 'tracking-step reached' : 'tracking-step'} key={step}>
                  <span>{step.replace('_', ' ')}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
