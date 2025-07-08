
import { FC } from 'react'

export const Logo: FC<{ light: string, dark: string }> = ({ light, dark }) => {
  return (
    <div className="flex items-center">
      <img
        src={light}
        alt="logo"
        className="h-8"
        style={{ display: 'var(--logo-light-display)' }}
      />

      <img
        src={dark}
        alt="logo"
        className="h-8"
        style={{ display: 'var(--logo-dark-display)' }}
      />
    </div>
  )
}

