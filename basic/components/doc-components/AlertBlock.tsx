import { ReactNode } from 'react'
import clsx from 'clsx'

type AlertType = 'tip' | 'note' | 'warning' | 'danger' | 'info'

interface AlertBoxProps {
  type?: AlertType
  children: ReactNode
}

const baseStyles = 'px-4 py-3 rounded-md border-l-4 my-4'
const typeStyles: Record<AlertType, string> = {
  tip: 'bg-green-50 dark:bg-green-900/20 border-green-400 dark:border-green-500 text-green-800 dark:text-green-100',
  note: 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-500 text-blue-800 dark:text-blue-100',
  warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400 dark:border-yellow-500 text-yellow-800 dark:text-yellow-100',
  danger: 'bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-500 text-red-800 dark:text-red-100',
  info: 'bg-sky-50 dark:bg-sky-900/20 border-sky-400 dark:border-sky-500 text-sky-800 dark:text-sky-100'
}

export const AlertBlock = ({ type = 'note', children }: AlertBoxProps) => {
  return (
    <div className={clsx(baseStyles, typeStyles[type])}>
      {children}
    </div>
  )
}

export default AlertBlock
