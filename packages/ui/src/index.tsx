import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ children, ...rest }) => {
  return (
    <button {...rest} style={{ padding: '0.5rem 1rem', borderRadius: '0.25rem', border: '1px solid #ccc' }}>
      {children}
    </button>
  );
};

export default Button;
