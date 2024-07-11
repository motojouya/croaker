"use client";

import { createContext, useContext, ReactNode } from "react";
import { Master } from "@/case/getMaster";

const SessionContext = createContext<Master | null>(null);

export type UseMaster = () => Master;
export const useMaster: UseMaster = () => {
  const master = useContext(SessionContext);
  if (!master) {
    throw new Error("no configurations on session");
  }
  return master;
};

export const SessionProvider: React.FC<{
  children: ReactNode;
  master: Master;
}> = ({ children, master }) => {
  return <SessionContext.Provider value={master}>{children}</SessionContext.Provider>;
};
