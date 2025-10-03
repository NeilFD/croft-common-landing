import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Create regular client for user validation
    const authHeader = req.headers.get('Authorization')!
    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    })

    const { email, role } = await req.json()

    console.log('Creating management user:', email, role)

    // Validate caller is admin using RPC
    const { data: callerRole } = await supabase.rpc('get_user_management_role', {
      _user_id: (await supabase.auth.getUser()).data.user?.id
    })

    if (callerRole !== 'admin') {
      throw new Error('Only admins can create users')
    }

    // Get user creation data from RPC (includes temp password)
    const { data: userData, error: rpcError } = await supabase.rpc('create_management_user', {
      p_email: email,
      p_role: role
    })

    if (rpcError) {
      console.error('RPC error:', rpcError)
      throw rpcError
    }

    console.log('User data from RPC:', userData)

    // Create user in auth.users using admin client
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.temp_password,
      email_confirm: true, // Auto-confirm email for management users
      user_metadata: {
        is_management_user: true
      }
    })

    if (authError) {
      console.error('Auth error:', authError)
      throw authError
    }

    console.log('Created auth user:', authUser.user.id)

    // Add user to user_roles table
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: authUser.user.id,
        role: userData.role
      })

    if (roleError) {
      console.error('Role error:', roleError)
      // Rollback: delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      throw roleError
    }

    // Create password metadata entry
    const { error: pwdError } = await supabaseAdmin
      .from('user_password_metadata')
      .insert({
        user_id: authUser.user.id,
        must_change_password: true,
        is_first_login: true,
        created_by: userData.created_by
      })

    if (pwdError) {
      console.error('Password metadata error:', pwdError)
      // Continue anyway - not critical
    }

    // Log audit entry
    const { error: auditError } = await supabaseAdmin
      .from('management_user_audit')
      .insert({
        action: 'user_created',
        target_user_id: authUser.user.id,
        actor_id: userData.created_by,
        details: { email: userData.email, role: userData.role }
      })

    if (auditError) {
      console.error('Audit error:', auditError)
      // Continue anyway - not critical
    }

    return new Response(
      JSON.stringify({
        user_id: authUser.user.id,
        email: userData.email,
        role: userData.role,
        temp_password: userData.temp_password
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Error creating user:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
