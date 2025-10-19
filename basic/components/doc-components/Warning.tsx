import { ReactNode } from 'react';
import { AlertBlock } from './AlertBlock';

interface WarningProps {
  children: ReactNode;
}

export const Warning = ({ children }: WarningProps) => {
  return <AlertBlock type="warning">{children}</AlertBlock>;
};

export default Warning;
