import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

// Generate stable session ID for this app session
export const DEBUG_SESSION_ID = `mobile-debug-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

// Edge Function endpoint for robust logging
const EDGE_FUNCTION_URL = 'https://xccidvoxhpgcnwinnyin.supabase.co/functions/v1/mobile-debug-log';

// Queue for failed logs
const LOG_QUEUE_KEY = 'cc_mobile_log_queue';
let isFlushingQueue = false;

/**
 * Send log to Edge Function (bypasses Supabase client issues)
 */
async function sendToEdgeFunction(logData: {
  session_id: string;
  step: string;
  data?: any;
  error_message?: string;
  platform: string;
  user_agent: string;
}): Promise<boolean> {
  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...logData,
        ts: new Date().toISOString()
      }),
    });
    
    return response.ok;
  } catch (error) {
    console.warn('Failed to send log to Edge Function:', error);
    return false;
  }
}

/**
 * Queue a log for later delivery
 */
function queueLog(logData: any): void {
  try {
    const queue = JSON.parse(localStorage.getItem(LOG_QUEUE_KEY) || '[]');
    queue.push(logData);
    // Keep only last 50 logs
    if (queue.length > 50) {
      queue.shift();
    }
    localStorage.setItem(LOG_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.warn('Failed to queue log:', error);
  }
}

/**
 * Flush queued logs
 */
async function flushLogQueue(): Promise<void> {
  if (isFlushingQueue) return;
  isFlushingQueue = true;
  
  try {
    const queue = JSON.parse(localStorage.getItem(LOG_QUEUE_KEY) || '[]');
    if (queue.length === 0) {
      isFlushingQueue = false;
      return;
    }
    
    const logToSend = queue[0];
    const success = await sendToEdgeFunction(logToSend);
    
    if (success) {
      queue.shift();
      localStorage.setItem(LOG_QUEUE_KEY, JSON.stringify(queue));
      
      // Continue flushing if more logs
      if (queue.length > 0) {
        setTimeout(() => {
          isFlushingQueue = false;
          flushLogQueue();
        }, 100);
      } else {
        isFlushingQueue = false;
      }
    } else {
      isFlushingQueue = false;
    }
  } catch (error) {
    console.warn('Error flushing log queue:', error);
    isFlushingQueue = false;
  }
}

/**
 * Centralized mobile debug logger
 * Logs to console, Supabase, AND Edge Function (for reliability)
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
  
  // Prepare Edge Function payload
  const edgeFunctionPayload = {
    session_id: DEBUG_SESSION_ID,
    step,
    data: data ? JSON.parse(JSON.stringify(data)) : null,
    error_message: error instanceof Error ? error.message : (error || null),
    platform,
    user_agent: userAgent
  };
  
  // Send to Edge Function (primary path, most reliable)
  const edgeFunctionSuccess = await sendToEdgeFunction(edgeFunctionPayload);
  
  // If Edge Function failed, queue for retry
  if (!edgeFunctionSuccess) {
    queueLog(edgeFunctionPayload);
  } else {
    // If successful, try to flush any queued logs
    flushLogQueue();
  }
  
  // Get current user if available
  let userId: string | undefined;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id;
  } catch {
    // Silent fail - user might not be authenticated
  }
  
  // Store in Supabase (secondary path, may fail in native)
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
