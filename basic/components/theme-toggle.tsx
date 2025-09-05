'use client'
import { useEffect, useState } from 'react'

export default function ThemeToggle({ defaultMode }: { defaultMode: string }) {
  const [theme, setTheme] = useState<'light' | 'dark-theme'>('light')
  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark-theme' | null
    const init = saved || (defaultMode == 'dark' ? 'dark-theme' : 'light')
    setTheme(init)
    document.documentElement.classList.toggle('dark-theme', init === 'dark-theme')
    document.documentElement.classList.toggle('dark', init === 'dark-theme')
  }, [])

  function toggle() {
    const next = theme === 'dark-theme' ? 'light' : 'dark-theme'
    setTheme(next)
    localStorage.setItem('theme', next)
    document.documentElement.classList.toggle('dark-theme', next === 'dark-theme')
    document.documentElement.classList.toggle('dark', next === 'dark-theme')
  }
  return (
    <button
      aria-label="Toggle theme"
      onClick={toggle}
      className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary/10 dark:bg-secondary/20 transition-colors duration-300"
    >
      {theme === 'dark-theme' ? (
        <i className="pi pi-sun text-yellow-100 text-xl transition-transform transform hover:scale-110" />
      ) : (
        <i className="pi pi-moon text-primary text-xl transition-transform transform hover:scale-110" />
      )}

    </button>
  )


}
