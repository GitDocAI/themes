import React from 'react';
import { AlertBlock, type AlertType } from './AlertBlock';

const VALID_ALERT_TYPES = ['note', 'tip', 'warning', 'danger', 'info', 'caution', 'important'] as const;


type CustomBlockquoteProps = React.ComponentProps<'blockquote'>;

export const BlockQuote: React.FC<CustomBlockquoteProps> = ({ children, ...props }) => {
  const childrenArray = React.Children.toArray(children).filter((ch: any) => ch != '\n');
  const firstChild = childrenArray[0] as any;

  if (React.isValidElement(firstChild) && typeof (firstChild.props as any).children === 'string') {
    const text: string = (firstChild.props as any).children;
    const match = text.match(/^\[!([A-Z]+)\]/);


    if (match) {
      const type = match[1].toLowerCase() as AlertType;

      if (VALID_ALERT_TYPES.includes(type)) {
        const newContent = text.slice(match[0].length).trim();

        const contentNodes = newContent
          ? [React.cloneElement(firstChild, { ...(firstChild.props as any), children: newContent }), ...childrenArray.slice(1)]
          : childrenArray.slice(1);

        return <AlertBlock type={type}>{contentNodes}</AlertBlock>;
      }
    }
  }
  return (
    <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic text-secondary mb-4" {...props}>
      {children}
    </blockquote>
  );
};
