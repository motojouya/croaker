'use client';

import { createContext, useContext, ReactNode } from 'react';
import { Master } from '@/case/getMaster';

const SessionContext = createContext<Master | null>(null);

export type UseMaster = () => Master | null;
export const useMaster: UseMaster = () => useContext(SessionContext);

export const SessionProvider: React.FC<{
  children: ReactNode;
  master: Master;
}> = ({ children, master }) => {
  return (
    <SessionContext.Provider value={master}>
      {children}
    </SessionContext.Provider>
  );
};
