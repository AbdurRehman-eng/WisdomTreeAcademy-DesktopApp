import React from 'react';
import './Button.css';

export const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary', // 'primary', 'secondary', 'destructive', 'ghost'
  size = 'md', // 'sm', 'md', 'lg', 'child'
  disabled = false,
  icon: Icon,
  className = '',
  ...props
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant} btn-${size} ${className}`}
      {...props}
    >
      {Icon && <Icon className="btn-icon" size={size === 'sm' ? 16 : size === 'lg' ? 22 : 18} />}
      {children}
    </button>
  );
};
export default Button;
