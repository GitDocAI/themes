// 'use client'
// import { createContext, useContext, useEffect, useState } from 'react'
//
// type Theme = 'light' | 'dark'
//
// const ThemeContext = createContext<{
//   theme: Theme
//   toggleTheme: () => void
// }>({
//   theme: 'light',
//   toggleTheme: () => { },
// })
//
// export function ThemeProvider({ children }: { children: React.ReactNode }) {
//   const [theme, setTheme] = useState<Theme>('light')
//
//   useEffect(() => {
//     document.documentElement.className = theme
//   }, [theme])
//
//   const toggleTheme = () =>
//     setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
//
//   return (
//     <ThemeContext.Provider value={{ theme, toggleTheme }}>
//       {children}
//     </ThemeContext.Provider>
//   )
// }
//
// export function useTheme() {
//   return useContext(ThemeContext)
// }
//
