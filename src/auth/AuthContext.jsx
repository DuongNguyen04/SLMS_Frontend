import { createContext, useContext, useEffect, useState } from 'react'
import { configureHttpClient } from '../api/httpClient'
import { slmsApi } from '../api/slmsApi'

const STORAGE_KEY = 'slms.auth.v1'

const AuthContext = createContext(null)

function readStoredSession() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw)
    if (!parsed?.token || !parsed?.username || !parsed?.role) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readStoredSession())

  useEffect(() => {
    configureHttpClient({
      getToken: () => session?.token ?? null,
      onUnauthorized: () => {
        setSession(null)
        window.localStorage.removeItem(STORAGE_KEY)
      },
    })
  }, [session])

  const persistSession = (nextSession) => {
    setSession(nextSession)
    if (nextSession) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession))
    } else {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }

  const login = async ({ username, password }) => {
    const response = await slmsApi.login({ username, password })
    const nextSession = {
      token: response.token,
      username: response.username,
      role: response.role,
    }
    persistSession(nextSession)
    return response
  }

  const register = async ({ username, password }) =>
    slmsApi.register({ username, password })

  const logout = () => {
    persistSession(null)
  }

  const contextValue = {
    session,
    isAuthenticated: Boolean(session?.token),
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}
