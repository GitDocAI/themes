import { ReactNode } from 'react';
import clsx from 'clsx';

export const CheckList = ({ children }: { children: ReactNode }) => {
  return <div className="my-6 space-y-4">{children}</div>;
};

type CheckItemVariant = 'do' | 'dont';

interface CheckItemProps {
  children: ReactNode;
  variant?: CheckItemVariant;
}

const itemConfig: Record<CheckItemVariant, {
  icon: string;
  iconClasses: string;
  textClasses: string;
}> = {
  do: {
    icon: 'pi pi-check-square',
    iconClasses: 'text-primary',
    textClasses: 'text-primary',
  },
  dont: {
    icon: 'pi pi-stop',
    iconClasses: 'text-secondary/70',
    textClasses: 'text-secondary ',
  },
};

export const CheckItem = ({ children, variant = 'do' }: CheckItemProps) => {
  const { icon, iconClasses, textClasses } = itemConfig[variant];

  return (
    <div className="flex items-start gap-3 ">
      <i className={clsx(icon, iconClasses, 'mt-1 text-lg')} />

      <div className={clsx('w-full', textClasses)}>
        {children}
      </div>
    </div>
  );
};
