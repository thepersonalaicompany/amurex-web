"use client";

import { NextResponse } from "next/server";
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";



function OmiCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  useEffect(() => {
    const handleOmiCallback = async () => {
      try {
        // Get the authenticated user
        console.log("Getting authenticated user");
        const { data: { session } } = await supabase.auth.getSession();
        console.log("Session data:", session);
        if (!session?.user?.id) {
          return NextResponse.json({ 
            success: false, 
            error: 'Unauthorized' 
          }, { status: 401 });
        }
    
        // Get the URL parameters
        const omi_uid = searchParams.get('uid');
    
        if (!omi_uid) {
          return NextResponse.json({ 
            success: false, 
            error: 'Missing OMI user ID' 
          }, { status: 400 });
        }
    
        // Update the user in Supabase
        const { data, error } = await supabase
          .from('users')
          .update({ 
            omi_connected: true,
            omi_uid: omi_uid
          })
          .eq('id', session.user.id)
          .select();
    
        if (error) {
          console.error('Error updating user:', error);
          return NextResponse.json({ 
            success: false, 
            error: error.message 
          }, { status: 500 });
        }
    
        router.push('/settings');
    
      } catch (error) {
        console.error('Error in OMI route:', error);
        return NextResponse.json({ 
          success: false, 
          error: error.message 
        }, { status: 500 });
      }
    };

    handleOmiCallback();
  }, [router, searchParams]);

  return (
    <div>
      <h1>Omi Callback</h1>
    </div>
  );
}

export default function OmiCallbackPage() {
  return (
    <Suspense fallback={
      <div>Loading...</div>
    }>
      <OmiCallback />
    </Suspense>
  );
}