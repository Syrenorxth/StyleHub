import React, { createContext, useCallback, useContext, useState } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';

const ToastContext = createContext(null);

const ICONS = {
  success: 'bi-check-circle-fill',
  danger: 'bi-exclamation-octagon-fill',
  warning: 'bi-exclamation-triangle-fill',
  info: 'bi-info-circle-fill',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  // notify('Đã thêm vào giỏ hàng') hoặc notify('Có lỗi', 'danger')
  const notify = useCallback((message, variant = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, variant }]);
  }, []);

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <ToastContainer position="bottom-end" className="p-3 toast-stack">
        {toasts.map((t) => (
          <Toast key={t.id} onClose={() => dismiss(t.id)} delay={3000} autohide className={`sh-toast sh-toast-${t.variant}`}>
            <Toast.Body className="d-flex align-items-center gap-2">
              <i className={`bi ${ICONS[t.variant] || ICONS.info}`}></i>
              <span className="flex-grow-1">{t.message}</span>
              <button type="button" className="btn-close btn-close-sm" aria-label="Đóng" onClick={() => dismiss(t.id)}></button>
            </Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
