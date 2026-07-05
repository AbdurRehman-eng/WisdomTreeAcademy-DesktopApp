import React from 'react';
import './Badge.css';

export const Badge = ({
  children,
  variant = 'neutral', // 'success', 'warning', 'danger', 'info', 'neutral', 'online', 'offline'
  className = '',
  ...props
}) => {
  return (
    <span className={`badge badge-${variant} ${className}`} {...props}>
      {variant === 'online' && <span className="badge-dot dot-online" />}
      {variant === 'offline' && <span className="badge-dot dot-offline" />}
      {children}
    </span>
  );
};
export default Badge;
