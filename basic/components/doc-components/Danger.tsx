import { ReactNode } from 'react';
import { AlertBlock } from './AlertBlock';

interface DangerProps {
  children: ReactNode;
}

export const Danger = ({ children }: DangerProps) => {
  return <AlertBlock type="danger">{children}</AlertBlock>;
};

export default Danger;
