import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// Generate or retrieve session ID
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

// Detect device type and browser info
const getDeviceInfo = () => {
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  
  let deviceType = 'desktop';
  if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
    deviceType = /iPad/.test(userAgent) ? 'tablet' : 'mobile';
  }
  
  let browser = 'unknown';
  if (userAgent.includes('Chrome')) browser = 'chrome';
  else if (userAgent.includes('Firefox')) browser = 'firefox';
  else if (userAgent.includes('Safari')) browser = 'safari';
  else if (userAgent.includes('Edge')) browser = 'edge';
  
  let os = 'unknown';
  if (platform.includes('Win')) os = 'windows';
  else if (platform.includes('Mac')) os = 'macos';
  else if (platform.includes('Linux')) os = 'linux';
  else if (/iPhone|iPad/.test(userAgent)) os = 'ios';
  else if (/Android/.test(userAgent)) os = 'android';
  
  return { deviceType, browser, os, userAgent };
};

export const useAnalytics = () => {
  const location = useLocation();
  const { user } = useAuth();
  const sessionId = getSessionId();
  const pageStartTime = useRef<number>(Date.now());
  const lastPagePath = useRef<string>('');
  const scrollDepth = useRef<number>(0);
  const maxScrollDepth = useRef<number>(0);

  // Initialize session
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const deviceInfo = getDeviceInfo();
        const referrer = document.referrer || null;
        
        await supabase.from('user_sessions').upsert({
          session_id: sessionId,
          user_id: user?.id || null,
          started_at: new Date().toISOString(),
          user_agent: deviceInfo.userAgent,
          referrer,
          device_type: deviceInfo.deviceType,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          is_authenticated: !!user
        }, {
          onConflict: 'session_id'
        });
      } catch (error) {
        // Silently handle RLS policy violations for non-admin users
        if (!error.message?.includes('new row violates row-level security')) {
          console.error('Analytics: Failed to initialize session:', error);
        }
      }
    };

    initializeSession();
  }, [sessionId, user]);

  // Track page views and navigation
  useEffect(() => {
    const trackPageView = async () => {
      try {
        const currentPath = location.pathname;
        const currentTime = Date.now();
        
        // Track previous page time spent if this isn't the first page
        if (lastPagePath.current && lastPagePath.current !== currentPath) {
          const timeSpent = Math.round((currentTime - pageStartTime.current) / 1000);
          
          try {
            await supabase.from('page_views').update({
              time_spent_seconds: timeSpent,
              scroll_depth_percent: maxScrollDepth.current,
              is_bounce: timeSpent < 5 // Consider less than 5 seconds a bounce
            }).eq('session_id', sessionId)
              .eq('page_path', lastPagePath.current)
              .order('viewed_at', { ascending: false })
              .limit(1);
          } catch (error) {
            // Silently handle RLS policy violations for non-admin users
          }
          
          try {
            // Track user journey
            await supabase.from('user_journeys').insert({
              session_id: sessionId,
              user_id: user?.id || null,
              from_page: lastPagePath.current,
              to_page: currentPath,
              transition_type: 'navigation'
            });
          } catch (error) {
            // Silently handle RLS policy violations for non-admin users
          }
        }
        
        try {
          // Track new page view
          await supabase.from('page_views').insert({
            session_id: sessionId,
            user_id: user?.id || null,
            page_path: currentPath,
            page_title: document.title,
            referrer: lastPagePath.current || document.referrer || null,
            viewed_at: new Date().toISOString()
          });
        } catch (error) {
          // Silently handle RLS policy violations for non-admin users
        }
        
        // Reset tracking variables
        pageStartTime.current = currentTime;
        lastPagePath.current = currentPath;
        maxScrollDepth.current = 0;
        
      } catch (error) {
        // Silently handle any other errors
      }
    };

    trackPageView();
  }, [location.pathname, sessionId, user]);

  // Track scroll depth
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      const scrollPercent = Math.round((scrollTop + windowHeight) / documentHeight * 100);
      
      if (scrollPercent > maxScrollDepth.current) {
        maxScrollDepth.current = Math.min(scrollPercent, 100);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Track interactions
  const trackInteraction = useCallback(async (
    interactionType: string,
    elementId?: string,
    elementClass?: string,
    elementText?: string,
    coordinates?: { x: number; y: number },
    additionalData?: any
  ) => {
    try {
      await supabase.from('user_interactions').insert({
        session_id: sessionId,
        user_id: user?.id || null,
        page_path: location.pathname,
        interaction_type: interactionType,
        element_id: elementId || null,
        element_class: elementClass || null,
        element_text: elementText || null,
        coordinates: coordinates || null,
        additional_data: additionalData || null
      });
    } catch (error) {
      // Silently handle RLS policy violations for non-admin users
    }
  }, [sessionId, user, location.pathname]);

  // Track clicks on buttons and links
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target) return;
      
      const isButton = target.tagName === 'BUTTON' || target.role === 'button';
      const isLink = target.tagName === 'A';
      
      if (isButton || isLink) {
        const elementId = target.id || undefined;
        const elementClass = target.className || undefined;
        const elementText = target.textContent?.trim().substring(0, 100) || undefined;
        const coordinates = { x: event.clientX, y: event.clientY };
        
        trackInteraction('click', elementId, elementClass, elementText, coordinates, {
          tagName: target.tagName,
          href: isLink ? (target as HTMLAnchorElement).href : undefined
        });
      }
    };

    document.addEventListener('click', handleClick, { passive: true });
    return () => document.removeEventListener('click', handleClick);
  }, [trackInteraction]);

  // Clean up session on page unload
  useEffect(() => {
    const handleBeforeUnload = async () => {
      try {
        const timeSpent = Math.round((Date.now() - pageStartTime.current) / 1000);
        
        // Update final page view time
        navigator.sendBeacon('/api/analytics/page-end', JSON.stringify({
          sessionId,
          pagePath: location.pathname,
          timeSpent,
          scrollDepth: maxScrollDepth.current
        }));
        
        try {
          // Update session end time
          await supabase.from('user_sessions').update({
            ended_at: new Date().toISOString()
          }).eq('session_id', sessionId);
        } catch (error) {
          // Silently handle RLS policy violations for non-admin users
        }
      } catch (error) {
        // Silently handle any other errors
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [sessionId, location.pathname]);

  return { trackInteraction };
};