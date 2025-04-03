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
      const state = searchParams.get('state');
      
      // Parse state parameter which includes userId:source:clientId:clientType format
      const [userId, source = 'settings', clientId, clientType] = state ? state.split(':') : ['', 'settings', '', ''];
      
      console.log('Source from state:', source);

      if (code) {
        try {
          // Get current session
          const { data: { session } } = await supabase.auth.getSession();
          
          if (!session) {
            throw new Error('No session found');
          }
          
          // Redirect to the API route with all necessary parameters
          // This will trigger the GET handler in the API route
          window.location.href = `/api/google/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
          
          // The rest of the function won't execute because of the redirect
          return;
        } catch (err) {
          console.error('Error in Google callback:', err);
          toast.error(err.message || 'Failed to process Google connection');
          
          // Determine error redirect path based on source
          let errorRedirectPath;
          if (source === 'onboarding') {
            errorRedirectPath = '/onboarding';
          } else if (source === 'search') {
            errorRedirectPath = '/search';
          } else {
            errorRedirectPath = '/settings';
          }
          
          router.push(`${errorRedirectPath}?error=${encodeURIComponent(err.message || 'Failed to connect Google account')}`);
        }
      } else if (error) {
        toast.error(`Connection failed: ${error}`);
        
        // Determine error redirect path based on source
        let errorRedirectPath;
        if (source === 'onboarding') {
          errorRedirectPath = '/onboarding';
        } else if (source === 'search') {
          errorRedirectPath = '/search';
        } else {
          errorRedirectPath = '/settings';
        }
        
        router.push(`${errorRedirectPath}?error=${encodeURIComponent(error)}`);
      } else {
        // Default redirect based on source
        let defaultRedirectPath;
        if (source === 'onboarding') {
          defaultRedirectPath = '/onboarding';
        } else if (source === 'search') {
          defaultRedirectPath = '/search';
        } else {
          defaultRedirectPath = '/settings';
        }
        
        router.push(defaultRedirectPath);
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
