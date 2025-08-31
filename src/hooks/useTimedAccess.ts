import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TimedAccessData {
  email: string;
  first_access_at: string | null;
  access_expires_at: string | null;
  is_active: boolean;
}

export const useTimedAccess = (email: string | null) => {
  const [accessData, setAccessData] = useState<TimedAccessData | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Check access status
  const checkAccessStatus = async (userEmail: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('secret_kitchen_access')
        .select('email, first_access_at, access_expires_at, is_active')
        .eq('email', userEmail.toLowerCase())
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error checking access status:', error);
        return null;
      }

      if (!data) {
        return null;
      }

      // Check if access has expired
      if (data.access_expires_at && new Date(data.access_expires_at) <= new Date()) {
        setIsExpired(true);
        return data;
      }

      setAccessData(data);
      return data;
    } catch (error) {
      console.error('Error in checkAccessStatus:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Record first access and set expiration
  const recordFirstAccess = async (userEmail: string) => {
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + (48 * 60 * 60 * 1000)); // 48 hours from now

      const { data, error } = await supabase
        .from('secret_kitchen_access')
        .update({
          first_access_at: now.toISOString(),
          access_expires_at: expiresAt.toISOString()
        })
        .eq('email', userEmail.toLowerCase())
        .eq('is_active', true)
        .select('email, first_access_at, access_expires_at, is_active')
        .maybeSingle();

      if (error) {
        console.error('Error recording first access:', error);
        toast({
          title: "Error",
          description: "Failed to initialize access timer.",
          variant: "destructive"
        });
        return false;
      }

      if (!data) {
        console.error('No matching record found for email:', userEmail);
        toast({
          title: "Access Error",
          description: "Your email is not authorized for access.",
          variant: "destructive"
        });
        return false;
      }

      setAccessData(data);
      toast({
        title: "Access Timer Started",
        description: "Your 48-hour access period has begun.",
      });
      
      return true;
    } catch (error) {
      console.error('Error in recordFirstAccess:', error);
      return false;
    }
  };

  // Handle access expiration
  const handleExpiration = async () => {
    setIsExpired(true);
    toast({
      title: "Access Expired",
      description: "Your 48-hour access period has ended. Please contact an administrator for renewed access.",
      variant: "destructive",
      duration: 10000
    });
  };

  useEffect(() => {
    if (email) {
      checkAccessStatus(email);
    }
  }, [email]);

  return {
    accessData,
    isExpired,
    loading,
    checkAccessStatus,
    recordFirstAccess,
    handleExpiration
  };
};