'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabaseClient';

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      console.log('callback page hit');
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const state = searchParams.get('state');

      if (code) {
        try {
          // Get current session
          const { data: { session } } = await supabase.auth.getSession();
          
          // Exchange code for tokens
          const response = await fetch('/api/google/callback', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              code,
              state,
              userId: session?.user?.id 
            }),
          });

          const data = await response.json();
          
          if (data.success) {
            toast.success('Google Docs connected successfully!');
            router.push('/settings?connection=success');
          } else {
            console.error('Connection failed:', data.error);
            router.push(`/settings?error=${encodeURIComponent(data.error)}`);
          }
        } catch (err) {
          console.error('Error in Google callback:', err);
          router.push('/settings?error=Failed to connect Google Docs');
        }
      } else if (error) {
        toast.error(`Connection failed: ${error}`);
        router.push(`/settings?error=${encodeURIComponent(error)}`);
      } else {
        router.push('/settings');
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-xl font-semibold mb-2">Connecting to Google...</h1>
        <p className="text-gray-500">Please wait while we complete the connection.</p>
      </div>
    </div>
  );
}
