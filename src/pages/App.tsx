import { useState, useEffect } from 'react'
import type { User } from 'firebase/auth'
import { subscribeToAuthState } from '../services/authService'
import { LoginPage } from './LoginPage'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    return subscribeToAuthState((u) => {
      setUser(u)
      setAuthLoading(false)
    })
  }, [])

  if (authLoading) return null
  if (!user) return <LoginPage />


  return (
    <div className="min-h-screen p-8 font-sans">
  
    </div>
  )
}

export default App
