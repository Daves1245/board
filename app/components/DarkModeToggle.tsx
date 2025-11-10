'use client'

import { useState, useEffect } from 'react'
import { Moon, Sun } from 'lucide-react'

export function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Check if dark mode preference exists
    const saved = localStorage.getItem('darkMode')
    if (saved) {
      const darkMode = JSON.parse(saved)
      setIsDark(darkMode)
      if (darkMode) {
        document.documentElement.classList.add('dark')
      }
    }
  }, [])

  const toggleDarkMode = () => {
    const newDarkMode = !isDark
    setIsDark(newDarkMode)
    localStorage.setItem('darkMode', JSON.stringify(newDarkMode))
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  return (
    <button
      onClick={toggleDarkMode}
      className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span>{isDark ? 'Light' : 'Dark'} Mode</span>
    </button>
  )
}