import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const formData = await req.formData();
    const sessionId = formData.get('session_id') as string;
    const csrfToken = formData.get('csrf_token') as string;
    const file = formData.get('file') as File;
    const optionalUrl = formData.get('optional_url') as string | null;

    if (!sessionId || !csrfToken || !file) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing inspiration upload for session ${sessionId}`);

    // Verify session
    const { data: sessionData, error: sessionError } = await supabase
      .from('client_session_context')
      .select('event_id, contact_email')
      .eq('id', sessionId)
      .eq('csrf_token', csrfToken)
      .eq('revoked', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (sessionError || !sessionData) {
      console.error('Session verification failed:', sessionError);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update last activity
    await supabase
      .from('client_session_context')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('id', sessionId);

    // Upload file to storage
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `client-inspiration/${sessionData.event_id}/${timestamp}-${sanitizedFilename}`;

    const fileBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from('client-files')
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to upload file' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('client-files')
      .getPublicUrl(storagePath);

    // Insert into client_inspiration_links with thumbnail_url as the uploaded image
    const { error: insertError } = await supabase
      .from('client_inspiration_links')
      .insert({
        event_id: sessionData.event_id,
        url: optionalUrl || publicUrl,
        link_type: 'upload',
        thumbnail_url: publicUrl,
        title: file.name,
      });

    if (insertError) {
      console.error('Database insert error:', insertError);
      // Clean up uploaded file
      await supabase.storage.from('client-files').remove([storagePath]);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to save inspiration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Inspiration uploaded successfully for event ${sessionData.event_id}`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Upload inspiration error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
