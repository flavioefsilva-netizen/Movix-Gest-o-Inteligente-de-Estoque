import { NextResponse } from 'next/server';

const DEFAULT_URL = 'https://bpfdfunkmndwviwfyovi.supabase.co';
const DEFAULT_KEY = 'sb_publishable_CwjadnejjA816OL-wJO8QA_o_uowhOg';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || DEFAULT_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || DEFAULT_KEY;

  return NextResponse.json({
    supabaseUrl,
    supabaseAnonKey,
  });
}
