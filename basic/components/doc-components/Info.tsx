import { ReactNode } from 'react';
import { AlertBlock } from './AlertBlock';

interface InfoProps {
  children: ReactNode;
}

export const Info = ({ children }: InfoProps) => {
  return <AlertBlock type="info">{children}</AlertBlock>;
};

export default Info;
