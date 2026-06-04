'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

type ViewMode = 'grid' | 'list'

interface ViewModeContextValue {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
}

const ViewModeContext = createContext<ViewModeContextValue | undefined>(undefined)

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  return (
    <ViewModeContext.Provider value={{ viewMode, setViewMode }}>
      {children}
    </ViewModeContext.Provider>
  )
}

export function useViewMode() {
  const ctx = useContext(ViewModeContext)
  if (!ctx) throw new Error('useViewMode must be used within ViewModeProvider')
  return ctx
}
