import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function POST(req) {
  try {
    const { access_token, workspace_id, bot_id, state, userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'No active session' }, { status: 401 });
    }

    const { error } = await supabase
      .from('users')
      .update({
        notion_connected: true,
        notion_access_token: access_token,
        notion_workspace_id: workspace_id,
        notion_bot_id: bot_id,
      })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user:', error);
      return NextResponse.json({ success: false, error: 'Failed to update user profile' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, message: 'Notion connected successfully' });
  } catch (error) {
    console.error('Error in Notion callback:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}