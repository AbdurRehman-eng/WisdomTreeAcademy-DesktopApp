import React from 'react';
import './Toast.css';
import { useAppContext, useApp } from '../../context/AppContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const Toast = () => {
  const { toasts } = useApp();

  const getIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle2 size={18} className="toast-icon success" />;
      case 'warning': return <AlertTriangle size={18} className="toast-icon warning" />;
      case 'error': return <AlertCircle size={18} className="toast-icon error" />;
      default: return <Info size={18} className="toast-icon info" />;
    }
  };

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-card toast-${toast.type} fade-in`}>
          {getIcon(toast.type)}
          <span className="toast-message">{toast.message}</span>
        </div>
      ))}
    </div>
  );
};

export default Toast;
