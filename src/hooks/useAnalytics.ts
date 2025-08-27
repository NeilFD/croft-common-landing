import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useOptimizedPerformance } from './useOptimizedPerformance';

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
  const performance = useOptimizedPerformance();
  const sessionId = getSessionId();
  const pageStartTime = useRef<number>(Date.now());
  const lastPagePath = useRef<string>('');
  const scrollDepth = useRef<number>(0);
  const maxScrollDepth = useRef<number>(0);

  // Defer session initialization until page is loaded
  useEffect(() => {
    if (!performance.isPageLoaded) return;
    const initializeSession = () => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(async () => {
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
            console.warn('Analytics: Session init failed:', error);
          }
        });
      } else {
        // Fallback with timeout
        setTimeout(async () => {
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
            console.warn('Analytics: Session init failed:', error);
          }
        }, 2000);
      }
    };

    initializeSession();
  }, [sessionId, user, performance.isPageLoaded]);

  // Track page views and navigation
  useEffect(() => {
    const trackPageView = async () => {
      try {
        const currentPath = location.pathname;
        const currentTime = Date.now();
        
        // Track previous page time spent if this isn't the first page
        if (lastPagePath.current && lastPagePath.current !== currentPath) {
          const timeSpent = Math.round((currentTime - pageStartTime.current) / 1000);
          
          await supabase.from('page_views').update({
            time_spent_seconds: timeSpent,
            scroll_depth_percent: maxScrollDepth.current,
            is_bounce: timeSpent < 5 // Consider less than 5 seconds a bounce
          }).eq('session_id', sessionId)
            .eq('page_path', lastPagePath.current)
            .order('viewed_at', { ascending: false })
            .limit(1);
          
          // Track user journey
          await supabase.from('user_journeys').insert({
            session_id: sessionId,
            user_id: user?.id || null,
            from_page: lastPagePath.current,
            to_page: currentPath,
            transition_type: 'navigation'
          });
        }
        
        // Track new page view
        await supabase.from('page_views').insert({
          session_id: sessionId,
          user_id: user?.id || null,
          page_path: currentPath,
          page_title: document.title,
          referrer: lastPagePath.current || document.referrer || null,
          viewed_at: new Date().toISOString()
        });
        
        // Reset tracking variables
        pageStartTime.current = currentTime;
        lastPagePath.current = currentPath;
        maxScrollDepth.current = 0;
        
      } catch (error) {
        console.error('Analytics: Failed to track page view:', error);
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

  // Enhanced interaction tracking with detailed categorization
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
        element_text: elementText?.trim().substring(0, 100) || null,
        coordinates: coordinates || null,
        additional_data: additionalData || null
      });
    } catch (error) {
      console.error('Analytics: Failed to track interaction:', error);
    }
  }, [sessionId, user, location.pathname]);

  // Enhanced tracking methods for specific interaction types
  const trackButtonClick = useCallback(async (
    buttonType: 'primary' | 'secondary' | 'cta' | 'navigation' | 'form_submit' | 'danger',
    elementId?: string,
    elementText?: string,
    coordinates?: { x: number; y: number },
    context?: any
  ) => {
    await trackInteraction('button_click', elementId, buttonType, elementText, coordinates, {
      button_type: buttonType,
      ...context
    });
  }, [trackInteraction]);

  const trackSecretGesture = useCallback(async (
    gestureType: 'attempt' | 'complete' | 'failed',
    gestureName: string,
    gestureData?: {
      points?: Array<{ x: number; y: number; timestamp: number }>;
      duration?: number;
      accuracy?: number;
      attempts?: number;
    }
  ) => {
    const interactionType = `secret_gesture_${gestureType}`;
    await trackInteraction(interactionType, undefined, gestureType, gestureName, undefined, {
      gesture_name: gestureName,
      gesture_data: gestureData
    });
  }, [trackInteraction]);

  const trackModalInteraction = useCallback(async (
    action: 'open' | 'close' | 'submit' | 'cancel',
    modalName: string,
    trigger?: string
  ) => {
    await trackInteraction('modal_interaction', undefined, action, modalName, undefined, {
      modal_name: modalName,
      action,
      trigger
    });
  }, [trackInteraction]);

  const trackCarouselNavigation = useCallback(async (
    direction: 'next' | 'previous' | 'dot',
    carouselName: string,
    currentSlide?: number,
    totalSlides?: number
  ) => {
    await trackInteraction('carousel_navigation', undefined, direction, carouselName, undefined, {
      carousel_name: carouselName,
      direction,
      current_slide: currentSlide,
      total_slides: totalSlides
    });
  }, [trackInteraction]);

  const trackFormInteraction = useCallback(async (
    action: 'start' | 'submit' | 'abandon' | 'error',
    formName: string,
    fieldName?: string,
    errorMessage?: string
  ) => {
    await trackInteraction('form_interaction', fieldName, action, formName, undefined, {
      form_name: formName,
      action,
      field_name: fieldName,
      error_message: errorMessage
    });
  }, [trackInteraction]);

  const trackGameInteraction = useCallback(async (
    action: 'start' | 'end' | 'pause' | 'score',
    gameName: string,
    score?: number,
    duration?: number
  ) => {
    await trackInteraction('game_interaction', undefined, action, gameName, undefined, {
      game_name: gameName,
      action,
      score,
      duration
    });
  }, [trackInteraction]);

  // Enhanced click tracking with detailed categorization
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target) return;
      
      const isButton = target.tagName === 'BUTTON' || target.role === 'button';
      const isLink = target.tagName === 'A';
      
      if (isButton || isLink) {
        const elementId = target.id || undefined;
        const elementText = target.textContent?.trim().substring(0, 100) || undefined;
        const coordinates = { x: event.clientX, y: event.clientY };
        
        // Categorize button types based on classes and content
        let buttonType: 'primary' | 'secondary' | 'cta' | 'navigation' | 'form_submit' | 'danger' = 'secondary';
        
        const classNames = target.className.toLowerCase();
        const textContent = elementText?.toLowerCase() || '';
        
        if (classNames.includes('primary') || classNames.includes('cta')) {
          buttonType = 'cta';
        } else if (textContent.includes('book') || textContent.includes('join') || textContent.includes('subscribe') || textContent.includes('sign up')) {
          buttonType = 'cta';
        } else if (classNames.includes('nav') || target.closest('nav')) {
          buttonType = 'navigation';
        } else if ((target as HTMLInputElement).type === 'submit' || textContent.includes('submit') || textContent.includes('send')) {
          buttonType = 'form_submit';
        } else if (classNames.includes('destructive') || classNames.includes('danger') || textContent.includes('delete')) {
          buttonType = 'danger';
        } else if (classNames.includes('primary')) {
          buttonType = 'primary';
        }
        
        // Track the categorized button click
        trackButtonClick(buttonType, elementId, elementText, coordinates, {
          tagName: target.tagName,
          href: isLink ? (target as HTMLAnchorElement).href : undefined,
          className: target.className
        });
      }
    };

    document.addEventListener('click', handleClick, { passive: true });
    return () => document.removeEventListener('click', handleClick);
  }, [trackButtonClick]);

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
        
        // Update session end time
        await supabase.from('user_sessions').update({
          ended_at: new Date().toISOString()
        }).eq('session_id', sessionId);
      } catch (error) {
        console.error('Analytics: Failed to cleanup session:', error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [sessionId, location.pathname]);

  return { 
    trackInteraction,
    trackButtonClick,
    trackSecretGesture,
    trackModalInteraction,
    trackCarouselNavigation,
    trackFormInteraction,
    trackGameInteraction
  };
};