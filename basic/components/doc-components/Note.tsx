import { ReactNode } from 'react';
import { AlertBlock } from './AlertBlock';

interface NoteProps {
  children: ReactNode;
}

export const Note = ({ children }: NoteProps) => {
  return <AlertBlock type="note">{children}</AlertBlock>;
};

export default Note;
