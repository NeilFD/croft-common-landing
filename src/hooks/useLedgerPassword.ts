import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface LedgerPasswordState {
  hasPassword: boolean;
  isValidated: boolean;
  isLocked: boolean;
  lockedUntil?: Date;
}

export const useLedgerPassword = () => {
  const { user } = useAuth();
  const [state, setState] = useState<LedgerPasswordState>({
    hasPassword: false,
    isValidated: false,
    isLocked: false
  });
  const [loading, setLoading] = useState(false);
  const [initialCheckComplete, setInitialCheckComplete] = useState(false);

  const checkPasswordStatus = useCallback(async () => {
    if (!user) {
      setInitialCheckComplete(true);
      return;
    }
    
    setLoading(true);
    console.log('Checking password status for user:', user.id);
    
    try {
      const { data, error } = await supabase
        .from('ledger_passwords')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      console.log('Password status check result:', data);
      
      setState(prev => ({
        ...prev,
        hasPassword: !!data,
        isLocked: data?.locked_until ? new Date(data.locked_until) > new Date() : false,
        lockedUntil: data?.locked_until ? new Date(data.locked_until) : undefined
      }));
    } catch (error) {
      console.error('Error checking password status:', error);
      toast.error('Failed to check password status');
    } finally {
      setLoading(false);
      setInitialCheckComplete(true);
    }
  }, [user]);

  const setPassword = async (password: string) => {
    if (!user) return false;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('set_ledger_password', {
        user_id_input: user.id,
        password_input: password
      });

      if (error) throw error;

      setState(prev => ({
        ...prev,
        hasPassword: true,
        isValidated: true
      }));

      toast.success('Ledger password set successfully');
      return true;
    } catch (error) {
      console.error('Error setting password:', error);
      toast.error('Failed to set password');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = async (password: string) => {
    if (!user) return false;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('validate_ledger_password', {
        user_id_input: user.id,
        password_input: password
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const result = data[0];
        
        if (result.locked) {
          setState(prev => ({
            ...prev,
            isLocked: true,
            lockedUntil: result.locked_until ? new Date(result.locked_until) : undefined
          }));
          toast.error('Account is temporarily locked due to too many failed attempts');
          return false;
        }

        if (result.valid) {
          setState(prev => ({
            ...prev,
            isValidated: true,
            isLocked: false
          }));
          toast.success('Access granted');
          return true;
        } else {
          toast.error('Invalid password');
          return false;
        }
      }

      return false;
    } catch (error) {
      console.error('Error validating password:', error);
      toast.error('Failed to validate password');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const resetValidation = () => {
    setState(prev => ({
      ...prev,
      isValidated: false
    }));
  };

  return {
    state,
    loading,
    initialCheckComplete,
    checkPasswordStatus,
    setPassword,
    validatePassword,
    resetValidation
  };
};