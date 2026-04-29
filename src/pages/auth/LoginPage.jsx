import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { getErrorMessage } from '../../utils/apiHelpers'

function resolveTargetByRole(role) {
  if (role === 'CUSTOMER') {
    return '/shop/products'
  }

  return '/ops'
}

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const loginNotice = location.state?.notice
  const [formState, setFormState] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const response = await login(formState)
      const fromRoute = location.state?.from?.pathname
      navigate(fromRoute || resolveTargetByRole(response.role), { replace: true })
    } catch (submitError) {
      setError(getErrorMessage(submitError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="auth-shell">
      <div className="auth-card reveal">
        <p className="brand-kicker">Smart Logistics Management System</p>
        <h1>Sign in</h1>
        <p className="auth-subtitle">Access customer storefront or operations dashboard by role.</p>

        {loginNotice && <p className="inline-success">{loginNotice}</p>}
        {error && <p className="inline-error">{error}</p>}

        <form onSubmit={onSubmit} className="form-grid">
          <label>
            Username
            <input
              value={formState.username}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, username: event.target.value }))
              }
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={formState.password}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, password: event.target.value }))
              }
              required
            />
          </label>

          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <p className="auth-switch">
          New here? <Link to="/register">Create account</Link>
        </p>
      </div>
    </section>
  )
}
