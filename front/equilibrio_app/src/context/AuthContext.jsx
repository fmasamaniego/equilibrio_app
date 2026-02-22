import { createContext, useState, useEffect } from 'react'
import { login as loginApi, getMe } from '../api/authService'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (token) {
      getMe()
        .then(setUser)
        .catch(() => {
          localStorage.removeItem('token')
          setToken(null)
          setUser(null)
        })
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [token])

  const login = async (username, password) => {
    const data = await loginApi(username, password)
    localStorage.setItem('token', data.access_token)
    setToken(data.access_token)
    const me = await getMe()
    setUser(me)
    return me
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
