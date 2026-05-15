'use client'

import { createContext, useContext } from 'react'

interface UserContextValue {
  hasUser: boolean
  firstName: string | null
  email: string | null
}

const UserContext = createContext<UserContextValue>({
  hasUser: false,
  firstName: null,
  email: null
})

export function UserProvider({
  hasUser,
  firstName = null,
  email = null,
  children
}: {
  hasUser: boolean
  firstName?: string | null
  email?: string | null
  children: React.ReactNode
}) {
  return (
    <UserContext.Provider value={{ hasUser, firstName, email }}>
      {children}
    </UserContext.Provider>
  )
}

export function useHasUser() {
  return useContext(UserContext).hasUser
}

export function useUser() {
  return useContext(UserContext)
}
