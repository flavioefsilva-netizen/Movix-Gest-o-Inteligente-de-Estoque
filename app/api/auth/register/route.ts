import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseUrl = rawUrl ? rawUrl.replace(/\/rest\/v1\/?$/, '') : undefined;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
      return NextResponse.json(
        { error: 'As credenciais do Supabase não estão configuradas (NEXT_PUBLIC_SUPABASE_URL está ausente).' },
        { status: 500 }
      );
    }

    // If service role key is configured, we use the Admin API to create and auto-confirm the user.
    // This is the most robust way in production to avoid blocking users with email confirmation requirements.
    if (supabaseServiceRoleKey) {
      const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });

      const { data, error } = await adminClient.auth.admin.createUser({
        email: email.trim(),
        password: password,
        email_confirm: true, // Auto-confirms the email address immediately
        user_metadata: {
          force_password_change: true
        }
      });

      if (error) {
        return NextResponse.json({ error: `Erro no Supabase Admin: ${error.message}` }, { status: 400 });
      }

      return NextResponse.json({ success: true, user: data.user, method: 'admin' });
    } else {
      // Fallback to standard signUp
      if (!supabaseAnonKey) {
        return NextResponse.json(
          { error: 'As credenciais do Supabase não estão configuradas (NEXT_PUBLIC_SUPABASE_ANON_KEY está ausente).' },
          { status: 500 }
        );
      }

      // Ephemeral client to sign up the user
      const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      });

      const { data, error } = await tempClient.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            force_password_change: true
          }
        }
      });

      if (error) {
        return NextResponse.json({ error: `Erro no Supabase Auth: ${error.message}` }, { status: 400 });
      }

      return NextResponse.json({ success: true, user: data.user, method: 'signup' });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno no servidor' }, { status: 500 });
  }
}
