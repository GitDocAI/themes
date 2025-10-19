import { ReactNode } from 'react';
import { AlertBlock } from './AlertBlock';

interface TipProps {
  children: ReactNode;
}

export const Tip = ({ children }: TipProps) => {
  return <AlertBlock type="tip">{children}</AlertBlock>;
};

export default Tip;
