import { ReactNode } from 'react';
import clsx from 'clsx';


export type AlertType = 'tip' | 'note' | 'warning' | 'danger' | 'info';

interface AlertBlockProps {
  type?: AlertType;
  children: ReactNode;
}

const alertConfig: Record<AlertType, { icon: string; colors: string }> = {
  tip: {
    icon: 'pi pi-lightbulb',
    colors: 'bg-green-500/10 border-green-500/30 text-green-400',
  },
  note: {
    icon: 'pi pi-pencil',
    colors: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
  },
  warning: {
    icon: 'pi pi-exclamation-triangle',
    colors: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
  },
  danger: {
    icon: 'pi pi-times-circle',
    colors: 'bg-red-500/10 border-red-500/30 text-red-400',
  },
  info: {
    icon: 'pi pi-info-circle',
    colors: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
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
