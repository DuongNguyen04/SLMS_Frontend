import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { slmsApi } from '../../api/slmsApi'
import { getErrorMessage } from '../../utils/apiHelpers'

export default function OpsHomePage() {
  const { session } = useAuth()
  const [metrics, setMetrics] = useState({
    orderCount: 0,
    inventoryCount: 0,
    userCount: 0,
  })
  const [error, setError] = useState('')

  useEffect(() => {
    const loadMetrics = async () => {
      setError('')

      try {
        const [orders, inventory, users] = await Promise.all([
          slmsApi.listOrders({ page: 0, size: 1 }),
          slmsApi.listInventory({ page: 0, size: 1 }),
          session.role === 'ADMIN' ? slmsApi.listUsers({ page: 0, size: 1 }) : Promise.resolve(null),
        ])

        setMetrics({
          orderCount: orders.totalElements,
          inventoryCount: inventory.totalElements,
          userCount: users?.totalElements ?? 0,
        })
      } catch (loadError) {
        setError(getErrorMessage(loadError))
      }
    }

    loadMetrics()
  }, [session.role])

  return (
    <section className="reveal">
      <div className="panel">
        <p className="eyebrow">Operations overview</p>
        <h2>Dashboard snapshot</h2>
        <p className="muted">Role: {session.role}</p>

        {error && <p className="inline-error">{error}</p>}

        <div className="stats-grid">
          <article>
            <h3>{metrics.orderCount}</h3>
            <p>Orders in system</p>
          </article>
          <article>
            <h3>{metrics.inventoryCount}</h3>
            <p>Inventory records</p>
          </article>
          {session.role === 'ADMIN' && (
            <article>
              <h3>{metrics.userCount}</h3>
              <p>Managed users</p>
            </article>
          )}
        </div>
      </div>
    </section>
  )
}
