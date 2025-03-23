'use client';

export const dynamic = 'force-dynamic'

import { Suspense } from 'react';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabaseClient';

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      console.log('callback page hit');
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const stateParam = searchParams.get('state');
      
      // Parse state parameter which includes userId:source format
      const [state, source = 'settings'] = stateParam ? stateParam.split(':') : [stateParam, 'settings'];
      
      console.log('Source from state:', source);

      if (code) {
        try {
          // Get current session
          const { data: { session } } = await supabase.auth.getSession();
          
          if (!session) {
            throw new Error('No session found');
          }
          
          // Exchange code for tokens
          const response = await fetch('/api/google/callback', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              code,
              state,
              userId: session.user.id,
              source
            }),
          });

          const data = await response.json();
          
          if (!data.success) {
            throw new Error(data.error || 'Failed to connect Google account');
          }
          
          toast.success('Google account connected successfully!');
          
          // Enable email tagging for the user
          await supabase
            .from('users')
            .update({ email_tagging_enabled: true })
            .eq('id', session.user.id);
          
          // If we're in the onboarding flow, redirect immediately and trigger background processes
          if (source === 'onboarding') {
            // Redirect user immediately to onboarding
            router.push('/onboarding?connection=success');
            
            // Trigger background processes
            // We don't await these calls, so they run in the background
            fetch("/api/google/import", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                userId: session.user.id,
                accessToken: session.access_token,
                runInBackground: true
              }),
            }).then(response => response.json())
              .then(data => {
                if (data.success) {
                  console.log('Google Docs import started in background');
                } else {
                  console.error('Failed to start Google Docs import:', data.error);
                }
              })
              .catch(err => {
                console.error('Error starting Google Docs import:', err);
              });
            
            // Also trigger email processing in background
            fetch("/api/gmail/process-labels", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                userId: session.user.id,
                categories: ['to respond', 'FYI', 'comment', 'notification', 'meeting update'],
                useStandardColors: false,
                runInBackground: true
              }),
            }).then(response => response.json())
              .then(data => {
                if (data.success) {
                  console.log('Email processing started in background');
                } else {
                  console.error('Failed to start email processing:', data.error);
                }
              })
              .catch(err => {
                console.error('Error starting email processing:', err);
              });
          } else {
            // For settings page, just redirect back
            router.push('/settings?connection=success');
          }
        } catch (err) {
          console.error('Error in Google callback:', err);
          toast.error(err.message || 'Failed to process Google connection');
          
          // Redirect based on source
          const redirectPath = source === 'onboarding' ? '/onboarding' : '/settings';
          router.push(`${redirectPath}?error=${encodeURIComponent(err.message || 'Failed to connect Google account')}`);
        }
      } else if (error) {
        toast.error(`Connection failed: ${error}`);
        // Redirect based on source
        const redirectPath = source === 'onboarding' ? '/onboarding' : '/settings';
        router.push(`${redirectPath}?error=${encodeURIComponent(error)}`);
      } else {
        // Redirect based on source
        const redirectPath = source === 'onboarding' ? '/onboarding' : '/settings';
        router.push(redirectPath);
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-xl font-semibold mb-4">Google Integration</h1>
        <div className="mb-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
        <p className="text-gray-700 mb-2">Connecting to Google...</p>
        <p className="text-sm text-gray-500">You&apos;ll be redirected in a moment.</p>
      </div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GoogleCallbackContent />
    </Suspense>
  );
}
