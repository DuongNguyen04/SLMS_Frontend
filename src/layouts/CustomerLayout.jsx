import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function CustomerLayout() {
  const { session, logout } = useAuth()

  return (
    <div className="app-shell customer-shell">
      <header className="store-header reveal">
        <div className="brand-wrap">
          <span className="brand-kicker">SLMS</span>
          <h1 className="brand-name">Modern Commerce</h1>
        </div>
        <nav className="main-nav" aria-label="Customer navigation">
          <NavLink to="/shop/products">Products</NavLink>
          <NavLink to="/shop/cart">Cart</NavLink>
          <NavLink to="/shop/orders">My Orders</NavLink>
        </nav>
        <div className="session-meta">
          <p className="session-user">{session.username}</p>
          <button type="button" className="btn btn-ghost" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
