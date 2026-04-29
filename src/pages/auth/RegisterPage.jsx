import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { getErrorMessage } from '../../utils/apiHelpers'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [formState, setFormState] = useState({
    username: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (formState.password !== formState.confirmPassword) {
      setError('Password confirmation does not match.')
      return
    }

    setIsSubmitting(true)
    try {
      await register({
        username: formState.username,
        password: formState.password,
      })
      navigate('/login', {
        replace: true,
        state: { notice: 'Registration successful. Please sign in.' },
      })
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
        <h1>Create account</h1>
        <p className="auth-subtitle">Self-registration creates a customer account.</p>

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
              minLength={6}
              value={formState.password}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, password: event.target.value }))
              }
              required
            />
          </label>

          <label>
            Confirm password
            <input
              type="password"
              minLength={6}
              value={formState.confirmPassword}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, confirmPassword: event.target.value }))
              }
              required
            />
          </label>

          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="auth-switch">
          Already have access? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </section>
  )
}
