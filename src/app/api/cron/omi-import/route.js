import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

const OMI_API_BASE_URL = 'https://api.omi.me/v2';
const OMI_APP_ID = process.env.OMI_APP_ID;
const OMI_API_KEY = process.env.OMI_API_KEY;

export async function GET(request) {
  try {
    // Verify cron secret to ensure this is called by the scheduler
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch users with OMI user IDs
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, omi_user_id')
      .not('omi_user_id', 'is', null);

    if (usersError) {
      throw new Error(`Error fetching users: ${usersError.message}`);
    }

    const results = [];
    
    // Process each user
    for (const user of users) {
      try {
        // Fetch conversations from OMI API
        const response = await fetch(
          `${OMI_API_BASE_URL}/integrations/${OMI_APP_ID}/conversations?uid=${user.omi_user_id}`,
          {
            headers: {
              'Authorization': `Bearer ${OMI_API_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`OMI API error: ${response.statusText}`);
        }

        const conversations = await response.json();

        // Store conversations in database
        const { error: insertError } = await supabase
          .from('omi_conversations')
          .upsert(
            conversations.map(conv => ({
              user_id: user.id,
              omi_user_id: user.omi_user_id,
              conversation_id: conv.id,
              data: conv,
              updated_at: new Date().toISOString(),
            })),
            { onConflict: 'user_id,conversation_id' }
          );

        if (insertError) {
          throw new Error(`Error storing conversations: ${insertError.message}`);
        }

        results.push({
          user_id: user.id,
          status: 'success',
          conversations_count: conversations.length,
        });
      } catch (error) {
        results.push({
          user_id: user.id,
          status: 'error',
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('OMI import error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
