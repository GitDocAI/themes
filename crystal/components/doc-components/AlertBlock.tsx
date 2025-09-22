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
    colors: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
  },
  note: {
    icon: 'pi pi-pencil',
    colors: 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400',
  },
  warning: {
    icon: 'pi pi-exclamation-triangle',
    colors: 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400',
  },
  caution: {
    icon: 'pi pi-exclamation-triangle',
    colors: 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400',
  },
  danger: {
    icon: 'pi pi-times-circle',
    colors: 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400',
  },
  important: {
    icon: 'pi pi-times-circle',
    colors: 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400',
  },
  info: {
    icon: 'pi pi-info-circle',
    colors: 'bg-sky-500/10 border-sky-500/30 text-sky-600 dark:text-sky-400',
  },
};

export const AlertBlock = ({ type = 'note', children }: AlertBlockProps) => {
  const { icon, colors } = alertConfig[type];

  return (
    <div
      className={clsx(
        'my-4 flex items-start gap-4 rounded-lg border p-4', // Estructura base con Flexbox
        colors
      )}
    >
      <i className={clsx(icon, 'mt-0.5 text-xl')} />

      <div className="text-secondary w-full">
        {children}
      </div>
    </div>
  );
};

export default AlertBlock;
