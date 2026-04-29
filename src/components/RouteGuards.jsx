import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function PublicOnlyRoute() {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export function RequireAuthRoute({ roles }) {
  const { isAuthenticated, session } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (roles?.length && !roles.includes(session.role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export function RoleHomeRedirect() {
  const { isAuthenticated, session } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (session.role === 'CUSTOMER') {
    return <Navigate to="/shop/products" replace />
  }

  return <Navigate to="/ops" replace />
}

export function AdminOnly({ children }) {
  const { session } = useAuth()
  if (session?.role !== 'ADMIN') {
    return <Navigate to="/ops" replace />
  }

  return children
}
