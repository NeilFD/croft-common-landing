import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

// Generate stable session ID for this app session
export const DEBUG_SESSION_ID = `mobile-debug-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

/**
 * Centralized mobile debug logger
 * Logs to console and Supabase mobile_debug_logs table
 */
export async function mobileLog(
  step: string,
  data?: any,
  error?: Error | string,
  showToast: boolean = false
): Promise<void> {
  const timestamp = new Date().toISOString();
  const platform = Capacitor.isNativePlatform() ? Capacitor.getPlatform() : 'web';
  const userAgent = navigator.userAgent;
  
  // Console log for local debugging
  const logData = {
    step,
    session: DEBUG_SESSION_ID,
    platform,
    data,
    error: error instanceof Error ? error.message : error,
    timestamp
  };
  
  if (error) {
    console.error(`📱 [${step}]`, logData);
  } else {
    console.log(`📱 [${step}]`, logData);
  }
  
  // Get current user if available
  let userId: string | undefined;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id;
  } catch {
    // Silent fail - user might not be authenticated
  }
  
  // Store in Supabase
  try {
    const { error: dbError } = await supabase
      .from('mobile_debug_logs')
      .insert({
        session_id: DEBUG_SESSION_ID,
        step,
        data: data ? JSON.parse(JSON.stringify(data)) : null,
        error_message: error instanceof Error ? error.message : (error || null),
        user_agent: userAgent,
        platform,
        user_id: userId
      });
    
    if (dbError) {
      console.warn('Failed to log to mobile_debug_logs:', dbError);
    }
  } catch (err) {
    console.warn('Exception logging to mobile_debug_logs:', err);
  }
  
  // Optional toast for critical errors
  if (showToast && error) {
    try {
      const { toast } = await import('@/components/ui/use-toast');
      toast({
        title: 'Debug Event',
        description: `${step}: ${error instanceof Error ? error.message : error}`,
        variant: 'destructive'
      });
    } catch {
      // Silent fail if toast not available
    }
  }
}
