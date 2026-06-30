import { createContext, useContext, useMemo, useState } from 'react'

const AuthFormContext = createContext(null)

export function AuthFormProvider({ children }) {
  const [focusedField, setFocusedField] = useState(null)
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [formReady, setFormReady] = useState(false)
  const [formProgress, setFormProgress] = useState(0)

  const value = useMemo(() => ({
    focusedField,
    setFocusedField,
    passwordVisible,
    setPasswordVisible,
    formReady,
    setFormReady,
    formProgress,
    setFormProgress,
  }), [focusedField, passwordVisible, formReady, formProgress])

  return (
    <AuthFormContext.Provider value={value}>
      {children}
    </AuthFormContext.Provider>
  )
}

export function useAuthForm() {
  const ctx = useContext(AuthFormContext)
  if (!ctx) throw new Error('useAuthForm must be used within AuthFormProvider')
  return ctx
}
