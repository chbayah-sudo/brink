"use client";

import { createContext, useContext, useEffect, useState } from "react";

type MenuState = { open: boolean; setOpen: (v: boolean) => void };

const MenuContext = createContext<MenuState>({ open: false, setOpen: () => {} });

export function MenuProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("no-scroll", open);
    return () => document.body.classList.remove("no-scroll");
  }, [open]);

  return (
    <MenuContext.Provider value={{ open, setOpen }}>
      {children}
    </MenuContext.Provider>
  );
}

export const useMenu = () => useContext(MenuContext);
