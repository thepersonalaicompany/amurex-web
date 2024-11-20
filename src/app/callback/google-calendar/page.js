'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function GoogleCalendarCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleGoogleCalendarCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session.user.id;

      if (code) {
        try {
          const response = await fetch(`/api/google/calendar/callback?code=${code}&state=${state}`);
          const data = await response.json();

          if (data.success) {
            const { access_token, refresh_token } = data;

            const updateResponse = await fetch('/api/google/calendar/callback', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                access_token,
                refresh_token,
                state,
                userId
              }),
            });

            const updateData = await updateResponse.json();
            if (updateData.success) {
              console.log('Google Calendar connected successfully');
              window.history.replaceState({}, document.title, window.location.pathname);
              router.push('/settings');
            } else {
              console.error('Error updating user:', updateData.error);
            }
          } else {
            console.error('Error connecting Google Calendar:', data.error);
          }
        } catch (error) {
          console.error('Error handling Google Calendar callback:', error);
        }
      }
    };

    handleGoogleCalendarCallback();
  }, [router]);

  return (
    <div>
      <h1>Connecting to Google Calendar...</h1>
    </div>
  );
}