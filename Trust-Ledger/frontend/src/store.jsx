import { createContext, useContext, useState, useCallback } from 'react';

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const pushToast = useCallback((msg, type = 'success', txHash = null) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, msg, type, txHash }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 6000);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(t => t.filter(x => x.id !== id));
  }, []);

  return (
    <StoreContext.Provider value={{ toasts, pushToast, dismissToast }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}
