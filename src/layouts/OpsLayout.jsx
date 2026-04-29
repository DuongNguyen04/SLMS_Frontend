import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

function linkClass({ isActive }) {
  return isActive ? 'ops-link active' : 'ops-link'
}

export default function OpsLayout() {
  const { session, logout } = useAuth()
  const isAdmin = session?.role === 'ADMIN'

  return (
    <div className="app-shell ops-shell">
      <aside className="ops-sidebar reveal">
        <div className="ops-brand">
          <span className="brand-kicker">SLMS OPS</span>
          <h1>{session.role} Console</h1>
          <p>Keep fulfillment, inventory and governance on track.</p>
        </div>

        <nav className="ops-nav" aria-label="Operations navigation">
          <NavLink to="/ops" end className={linkClass}>
            Overview
          </NavLink>
          <NavLink to="/ops/orders" className={linkClass}>
            Orders
          </NavLink>
          <NavLink to="/ops/inventory" className={linkClass}>
            Inventory
          </NavLink>
          <NavLink to="/ops/shipments" className={linkClass}>
            Shipments
          </NavLink>
          {isAdmin && (
            <>
              <NavLink to="/ops/products" className={linkClass}>
                Products
              </NavLink>
              <NavLink to="/ops/users" className={linkClass}>
                Users
              </NavLink>
              <NavLink to="/ops/reports" className={linkClass}>
                Reports
              </NavLink>
              <NavLink to="/ops/batch" className={linkClass}>
                Batch
              </NavLink>
            </>
          )}
        </nav>

        <button type="button" className="btn btn-light" onClick={logout}>
          Logout
        </button>
      </aside>

      <main className="ops-content">
        <Outlet />
      </main>
    </div>
  )
}
