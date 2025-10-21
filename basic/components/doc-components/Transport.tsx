import React from 'react';
import ReactDOM from 'react-dom';

interface TransportProps {
  children: React.ReactNode;
}

const Transport: React.FC<TransportProps> = ({ children }) => {
  return ReactDOM.createPortal(
    children,
    document.getElementById('aside-root') as HTMLElement
  );
};

export default Transport;

