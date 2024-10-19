import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('id, title, url, tags');
      // .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, documents: data });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

