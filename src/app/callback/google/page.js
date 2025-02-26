'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const connection = searchParams.get('connection');
    const error = searchParams.get('error');

    if (connection === 'success') {
      toast.success('Google Docs connected successfully!');
      router.push('/settings');
    } else if (error) {
      toast.error(`Connection failed: ${error}`);
      router.push('/settings');
    } else {
      // If no status parameters, redirect to settings
      router.push('/settings');
    }
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
