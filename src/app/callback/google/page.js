'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function GoogleCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleGoogleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state'); // This contains the userId we passed
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session.user.id;

      if (code) {
        try {
          const response = await fetch(`/api/google/callback?code=${code}&state=${state}`);
          console.log('Making api call');

          const data = await response.json();

          if (data.success) {
            const { access_token, refresh_token } = data;
            console.log('access_token', access_token);

            const updateResponse = await fetch('/api/google/callback', {
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
              console.log('Google Docs connected successfully');
              window.history.replaceState({}, document.title, window.location.pathname); // Remove query parameters from URL without triggering navigation
              router.push('/'); // Redirect to the main page
            } else {
              console.error('Error updating user:', updateData.error);
            }
          } else {
            console.error('Error connecting Google Docs:', data.error);
          }
        } catch (error) {
          console.error('Error handling Google callback:', error);
        }
      }
    };

    handleGoogleCallback();
  }, [router]);

  return (
    <div>
      <h1>Connecting to Google Docs...</h1>
    </div>
  );
}
