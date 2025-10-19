'use client'

import { useTheme } from 'next-themes'
import config from '../gitdocai.config.json'

export const useThemeColors = () => {
  const { resolvedTheme } = useTheme()

  const primaryColor = resolvedTheme === 'dark' ? config.colors.dark : config.colors.light

  return {
    primaryColor,
    primaryColorClass: 'text-[var(--primary-color)]',
    borderColorClass: 'border-[var(--primary-color)]',
  }
}

export const getPrimaryColorStyle = (resolvedTheme: string | undefined) => {
  const primaryColor = resolvedTheme === 'dark' ? config.colors.dark : config.colors.light
  return primaryColor
}
