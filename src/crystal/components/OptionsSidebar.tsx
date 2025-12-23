import { type ReactNode } from 'react';

interface OptionsSidebarProps {
  children?: ReactNode;
  theme: string;
}

const OptionsSidebar = ({ children }: OptionsSidebarProps) => {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      {children}
    </div>
  );
};

export default OptionsSidebar;
