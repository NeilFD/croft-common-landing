import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const sessionId = formData.get('session_id') as string;
    const csrfToken = formData.get('csrf_token') as string;
    const file = formData.get('file') as File;

    if (!sessionId || !csrfToken || !file) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify session
    const { data: sessionData, error: sessionError } = await supabase
      .from('client_session_context')
      .select('event_id, contact_email, csrf_token, expires_at, revoked')
      .eq('id', sessionId)
      .single();

    if (sessionError || !sessionData) {
      console.error('[client-upload-file] Session not found:', sessionError);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify CSRF token
    if (sessionData.csrf_token !== csrfToken) {
      console.error('[client-upload-file] CSRF token mismatch');
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid CSRF token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if session is expired or revoked
    if (sessionData.revoked || new Date(sessionData.expires_at) < new Date()) {
      console.error('[client-upload-file] Session expired or revoked');
      return new Response(
        JSON.stringify({ success: false, error: 'Session expired' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update last activity
    await supabase
      .from('client_session_context')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('id', sessionId);

    // Upload file to storage with service role
    const fileName = `${sessionData.event_id}/${Date.now()}-${file.name}`;
    const fileBytes = await file.arrayBuffer();
    
    const { error: uploadError } = await supabase.storage
      .from('client-files')
      .upload(fileName, fileBytes, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('[client-upload-file] Storage upload error:', uploadError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to upload file' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert file metadata into database
    const { data: fileData, error: dbError } = await supabase
      .from('client_files')
      .insert({
        event_id: sessionData.event_id,
        filename: file.name,
        storage_path: fileName,
        mime_type: file.type,
        size_bytes: file.size,
      })
      .select()
      .single();

    if (dbError) {
      console.error('[client-upload-file] Database insert error:', dbError);
      // Try to clean up uploaded file
      await supabase.storage.from('client-files').remove([fileName]);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to save file record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[client-upload-file] File uploaded successfully:', fileData);

    return new Response(
      JSON.stringify({ success: true, file: fileData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[client-upload-file] Unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
