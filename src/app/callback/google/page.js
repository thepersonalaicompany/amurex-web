'use client';

export const dynamic = 'force-dynamic'

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabaseClient';

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [emailStats, setEmailStats] = useState({ processed: 0, stored: 0, total: 0 });

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
          setIsProcessing(true);
          // Get current session
          const { data: { session } } = await supabase.auth.getSession();
          
          if (!session) {
            throw new Error('No session found');
          }
          
          // Exchange code for tokens
          setProcessingStep('Connecting to Google...');
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
          setProcessingStep('Enabling email categorization...');
          const { error: updateError } = await supabase
            .from('users')
            .update({ email_tagging_enabled: true })
            .eq('id', session.user.id);
            
          if (updateError) {
            console.error("Error enabling email tagging:", updateError);
          }
          
          // If we're in the onboarding flow, import Google Docs
          if (source === 'onboarding') {
            // Step 1: Import Google Docs
            setProcessingStep('Importing Google Docs...');
            const docsResponse = await fetch("/api/google/import", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                userId: session.user.id,
                accessToken: session.access_token,
              }),
            });
            
            const docsData = await docsResponse.json();
            
            if (!docsData.success) {
              throw new Error(docsData.error || 'Failed to import Google Docs');
            }
            
            toast.success('Google Docs imported successfully!');
            
            // Step 2: Process Gmail emails
            setProcessingStep('Processing emails...');
            const emailResponse = await fetch("/api/gmail/process-labels", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                userId: session.user.id,
                categories: ['to respond', 'FYI', 'comment', 'notification', 'meeting update'],
                useStandardColors: false
              }),
            });
            
            const emailData = await emailResponse.json();
            
            if (!emailData.success) {
              if (emailData.errorType === "insufficient_permissions") {
                throw new Error('Insufficient Gmail permissions. Please reconnect your Google account.');
              } else {
                throw new Error(emailData.error || 'Failed to process emails');
              }
            }
            
            // Store email stats
            setEmailStats({
              processed: emailData.processed || 0,
              stored: emailData.total_stored || 0,
              total: emailData.total_found || 0
            });
            
            toast.success(`Successfully processed ${emailData.total_stored} emails`);
            
            // Redirect to onboarding with success
            setTimeout(() => {
              router.push('/onboarding?import=success');
            }, 2000);
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
        } finally {
          setIsProcessing(false);
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
        
        {isProcessing ? (
          <>
            <div className="mb-4">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
            <p className="text-gray-700 mb-2">{processingStep}</p>
            <p className="text-sm text-gray-500">This may take a few moments...</p>
          </>
        ) : (
          <p className="text-gray-500">Connecting to Google...</p>
        )}
        
        {emailStats.stored > 0 && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg text-left">
            <h3 className="text-lg font-medium text-blue-800">Email Processing Complete</h3>
            <div className="mt-2 space-y-1">
              <p className="text-sm text-blue-700">
                <span className="font-medium">Total emails found:</span> {emailStats.total}
              </p>
              <p className="text-sm text-blue-700">
                <span className="font-medium">Emails processed:</span> {emailStats.processed}
              </p>
              <p className="text-sm text-blue-700">
                <span className="font-medium">Emails stored:</span> {emailStats.stored}
              </p>
            </div>
          </div>
        )}
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
