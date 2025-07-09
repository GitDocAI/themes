
import { FC } from 'react'

export const Logo: FC<{ light: string, dark: string }> = ({ light, dark }) => {
  if (dark == "" && light == "" || !dark && !light) {
    return
  }
  if (!dark || dark == "") {
    dark = light
  }
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

