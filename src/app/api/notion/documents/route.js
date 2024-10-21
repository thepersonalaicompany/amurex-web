import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Client } from '@notionhq/client';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function GET(req) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('notion_access_token')
      .eq('id', session.user.id)
      .single();

    if (userError || !user.notion_access_token) {
      return NextResponse.json({ success: false, error: 'Notion not connected' }, { status: 400 });
    }

    const notion = new Client({ auth: user.notion_access_token });

    const response = await notion.search({
      filter: {
        property: 'object',
        value: 'page'
      }
    });

    const documents = response.results.map(page => ({
      id: page.id,
      title: page.properties.title?.title[0]?.plain_text || 'Untitled',
      url: page.url
    }));

    return NextResponse.json({ success: true, documents });
  } catch (error) {
    console.error('Error fetching Notion documents:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
