'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function NotionCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleNotionCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');

      if (code) {
        try {
          const response = await fetch(`/api/notion/callback?code=${code}&state=${state}`);
          const data = await response.json();
          const { data: { session } } = await supabase.auth.getSession();
          const userId = session.user.id;

          if (data.success) {
            const { access_token, workspace_id, bot_id } = data;

            const updateResponse = await fetch('/api/notion/completeIntegration', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                access_token,
                workspace_id,
                bot_id,
                state,
                userId
              }),
            });

            const updateData = await updateResponse.json();
            if (updateData.success) {
              console.log('Notion connected successfully');
              window.history.replaceState({}, document.title, window.location.pathname);
              router.push('/'); // Redirect to the main page
            } else {
              console.error('Error updating user:', updateData.error);
            }
          } else {
            console.error('Error connecting Notion:', data.error);
          }
        } catch (error) {
          console.error('Error handling Notion callback:', error);
        }
      }
    };

    handleNotionCallback();
  }, [router]);

  return (
    <div>
      <h1>Notion Callback</h1>
    </div>
  );
}