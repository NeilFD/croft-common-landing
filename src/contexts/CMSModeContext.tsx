import { createContext, useContext, ReactNode } from 'react';

interface CMSModeContextType {
  isCMSMode: boolean;
}

const CMSModeContext = createContext<CMSModeContextType>({
  isCMSMode: false,
});

export const useCMSMode = () => {
  return useContext(CMSModeContext);
};

interface CMSModeProviderProps {
  children: ReactNode;
  isCMSMode?: boolean;
}

export const CMSModeProvider = ({ children, isCMSMode = false }: CMSModeProviderProps) => {
  return (
    <CMSModeContext.Provider value={{ isCMSMode }}>
      {children}
    </CMSModeContext.Provider>
  );
};