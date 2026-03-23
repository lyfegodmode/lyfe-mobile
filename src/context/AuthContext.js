import { createContext, useContext, useEffect, useState } from 'react'
import * as SecureStore from 'expo-secure-store'
import { api } from '../api/index.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    SecureStore.getItemAsync('token').then(async (token) => {
      if (token) {
        try {
          const me = await api.auth.me()
          setUser(me)
        } catch {
          await SecureStore.deleteItemAsync('token')
        }
      }
      setLoading(false)
    })
  }, [])

  async function login(userData, token) {
    await SecureStore.setItemAsync('token', token)
    setUser(userData)
  }

  async function logout() {
    await SecureStore.deleteItemAsync('token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
