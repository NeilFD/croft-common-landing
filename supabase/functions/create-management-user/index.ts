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
    const authHeader = req.headers.get('Authorization') || ''
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || supabaseServiceKey
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { email, role, user_name, job_title } = await req.json()

    console.log('Creating management user:', email, role, user_name, job_title)

    // Validate inputs
    if (!email || !role || !user_name || !job_title) {
      throw new Error('Email, role, user name, and job title are required')
    }

    // Map frontend roles to backend roles
    const roleMapping: Record<string, string> = {
      'Admin': 'admin',
      'Manager': 'manager'
    }

    const mappedRole = roleMapping[role] || role.toLowerCase()
    console.log('Mapped role:', role, '->', mappedRole)

    // Validate caller is admin using RPC
    const accessToken = authHeader.replace('Bearer ', '').trim()
    console.log('Auth header present:', !!authHeader, 'token length:', accessToken.length)
    if (!accessToken) {
      throw new Error('Missing access token')
    }

    const { data: callerData, error: callerErr } = await supabaseAdmin.auth.getUser(accessToken)
    if (callerErr || !callerData?.user) {
      console.error('Auth getUser error:', callerErr)
      throw new Error('Unable to verify caller')
    }

    const callerId = callerData.user.id
    console.log('Caller ID:', callerId)
    const { data: callerRole, error: roleErr } = await supabaseAdmin.rpc('get_user_management_role', {
      _user_id: callerId
    })
    console.log('Caller role resolved:', callerRole)

    if (roleErr) {
      console.error('Role check error:', roleErr)
      throw new Error('Failed to verify permissions')
    }

    if (callerRole !== 'admin') {
      throw new Error('Only admins can create users')
    }

    // Get user creation data from RPC (includes temp password)
    const { data: userData, error: rpcError } = await supabase.rpc('create_management_user', {
      p_email: email,
      p_role: mappedRole
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
        is_management_user: true,
        user_name: user_name,
        job_title: job_title
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

    // Create management profile
    const { error: profileError } = await supabaseAdmin
      .from('management_profiles')
      .insert({
        user_id: authUser.user.id,
        user_name: user_name,
        email: userData.email,
        job_title: job_title
      })

    if (profileError) {
      console.error('Profile error:', profileError)
      // Rollback: delete the auth user and role
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      await supabaseAdmin.from('user_roles').delete().eq('user_id', authUser.user.id)
      throw profileError
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
        details: { 
          email: userData.email, 
          role: userData.role,
          user_name: user_name,
          job_title: job_title
        }
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
