import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DiagnosticResult {
  vapidSubject: string | null;
  vapidPublicKey: string | null;
  vapidPrivateKey: string | null;
  subjectFormat: 'mailto' | 'url' | 'invalid' | 'missing';
  appleCompatible: boolean;
  issues: string[];
  recommendations: string[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔍 Starting VAPID configuration diagnostic...');

    // Get VAPID configuration from secrets
    const vapidSubject = Deno.env.get('VAPID_SUBJECT');
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    console.log('📋 Retrieved VAPID configuration from secrets');

    const result: DiagnosticResult = {
      vapidSubject,
      vapidPublicKey: vapidPublicKey ? 'Present (hidden)' : null,
      vapidPrivateKey: vapidPrivateKey ? 'Present (hidden)' : null,
      subjectFormat: 'missing',
      appleCompatible: false,
      issues: [],
      recommendations: []
    };

    // Analyze VAPID Subject
    if (!vapidSubject) {
      result.issues.push('VAPID_SUBJECT is missing');
      result.recommendations.push('Set VAPID_SUBJECT to either mailto:your-email@domain.com or https://your-domain.com');
    } else {
      console.log(`🔍 Analyzing VAPID subject: ${vapidSubject}`);
      
      if (vapidSubject.startsWith('mailto:')) {
        result.subjectFormat = 'mailto';
        const email = vapidSubject.substring(7);
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (emailRegex.test(email)) {
          result.appleCompatible = true;
          console.log('✅ Valid mailto format detected');
        } else {
          result.issues.push('VAPID_SUBJECT mailto format is invalid');
          result.recommendations.push('Ensure VAPID_SUBJECT follows format: mailto:valid-email@domain.com');
        }
      } else if (vapidSubject.startsWith('https://') || vapidSubject.startsWith('http://')) {
        result.subjectFormat = 'url';
        
        try {
          const url = new URL(vapidSubject);
          if (url.hostname.includes('croftcommontest.com') || url.hostname === 'localhost') {
            result.appleCompatible = true;
            console.log('✅ Valid URL format detected matching app domain');
          } else {
            result.issues.push('VAPID_SUBJECT URL does not match app domain');
            result.recommendations.push('VAPID_SUBJECT URL should match your app domain (croftcommontest.com)');
          }
        } catch {
          result.issues.push('VAPID_SUBJECT URL format is invalid');
          result.recommendations.push('Ensure VAPID_SUBJECT is a valid URL starting with https://');
        }
      } else {
        result.subjectFormat = 'invalid';
        result.issues.push('VAPID_SUBJECT must start with "mailto:" or "https://"');
        result.recommendations.push('Change VAPID_SUBJECT to either mailto:your-email@domain.com or https://croftcommontest.com');
      }
    }

    // Check VAPID Keys
    if (!vapidPublicKey) {
      result.issues.push('VAPID_PUBLIC_KEY is missing');
      result.recommendations.push('Generate and set VAPID_PUBLIC_KEY');
    }

    if (!vapidPrivateKey) {
      result.issues.push('VAPID_PRIVATE_KEY is missing');
      result.recommendations.push('Generate and set VAPID_PRIVATE_KEY');
    }

    // Additional Apple-specific checks
    if (result.subjectFormat === 'mailto' && result.appleCompatible) {
      console.log('📱 VAPID configuration appears compatible with Apple Push');
    } else if (result.subjectFormat === 'url' && result.appleCompatible) {
      console.log('📱 VAPID configuration appears compatible with Apple Push');
    } else {
      result.issues.push('Current VAPID configuration may not be compatible with iOS Safari');
      result.recommendations.push('Apple requires VAPID_SUBJECT to be either a valid mailto: or a URL matching your domain');
    }

    console.log('🏁 VAPID diagnostic completed');

    return new Response(JSON.stringify(result, null, 2), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
    });

  } catch (error) {
    console.error('❌ VAPID diagnostic error:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to check VAPID configuration',
      details: error.message 
    }), {
      status: 500,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
    });
  }
});