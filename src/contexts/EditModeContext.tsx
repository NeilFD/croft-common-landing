import { createContext, useContext, useState, ReactNode } from 'react';

interface EditModeContextType {
  isEditMode: boolean;
  toggleEditMode: () => void;
  isPreviewMode: boolean;
  togglePreviewMode: () => void;
  pendingChanges: number;
  incrementPendingChanges: () => void;
  decrementPendingChanges: () => void;
  resetPendingChanges: () => void;
}

const EditModeContext = createContext<EditModeContextType | undefined>(undefined);

export const useEditMode = () => {
  const context = useContext(EditModeContext);
  if (!context) {
    throw new Error('useEditMode must be used within an EditModeProvider');
  }
  return context;
};

interface EditModeProviderProps {
  children: ReactNode;
}

export const EditModeProvider = ({ children }: EditModeProviderProps) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [pendingChanges, setPendingChanges] = useState(0);

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
    if (isPreviewMode) setIsPreviewMode(false);
  };

  const togglePreviewMode = () => {
    setIsPreviewMode(!isPreviewMode);
  };

  const incrementPendingChanges = () => {
    setPendingChanges(prev => prev + 1);
  };

  const decrementPendingChanges = () => {
    setPendingChanges(prev => Math.max(0, prev - 1));
  };

  const resetPendingChanges = () => {
    setPendingChanges(0);
  };

  return (
    <EditModeContext.Provider value={{
      isEditMode,
      toggleEditMode,
      isPreviewMode,
      togglePreviewMode,
      pendingChanges,
      incrementPendingChanges,
      decrementPendingChanges,
      resetPendingChanges
    }}>
      {children}
    </EditModeContext.Provider>
  );
};