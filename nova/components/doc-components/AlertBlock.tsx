import { ReactNode } from 'react';
import clsx from 'clsx';


export type AlertType = 'tip' | 'note' | 'warning' | 'danger' | 'info' | 'caution' | 'important';

interface AlertBlockProps {
  type?: AlertType;
  children: ReactNode;
}

const alertConfig: Record<AlertType, { icon: string; colors: string }> = {
  tip: {
    icon: 'pi pi-lightbulb',
    colors: 'bg-emerald-50/80 border-emerald-200/60 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-700/40 dark:text-emerald-300',
  },
  note: {
    icon: 'pi pi-pencil',
    colors: 'bg-blue-50/80 border-blue-200/60 text-blue-700 dark:bg-blue-900/20 dark:border-blue-700/40 dark:text-blue-300',
  },
  warning: {
    icon: 'pi pi-exclamation-triangle',
    colors: 'bg-amber-50/80 border-amber-200/60 text-amber-700 dark:bg-amber-900/20 dark:border-amber-700/40 dark:text-amber-300',
  },
  caution: {
    icon: 'pi pi-exclamation-triangle',
    colors: 'bg-amber-50/80 border-amber-200/60 text-amber-700 dark:bg-amber-900/20 dark:border-amber-700/40 dark:text-amber-300',
  },
  danger: {
    icon: 'pi pi-times-circle',
    colors: 'bg-red-50/80 border-red-200/60 text-red-700 dark:bg-red-900/20 dark:border-red-700/40 dark:text-red-300',
  },
  important: {
    icon: 'pi pi-times-circle',
    colors: 'bg-red-50/80 border-red-200/60 text-red-700 dark:bg-red-900/20 dark:border-red-700/40 dark:text-red-300',
  },
  info: {
    icon: 'pi pi-info-circle',
    colors: 'bg-sky-50/80 border-sky-200/60 text-sky-700 dark:bg-sky-900/20 dark:border-sky-700/40 dark:text-sky-300',
  },
};

export const AlertBlock = ({ type = 'note', children }: AlertBlockProps) => {
  const { icon, colors } = alertConfig[type];

  return (
    <div
      className={clsx(
        'my-6 flex items-start gap-3 rounded-lg border p-4 shadow-nova backdrop-blur-sm', // Estructura base con Flexbox
        colors
      )}
    >
      <i className={clsx(icon, 'mt-0.5 text-lg flex-shrink-0')} />

      <div className="text-secondary w-full leading-relaxed">
        {children}
      </div>
    </div>
  );
};

export default AlertBlock;
