import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with the service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Get the appropriate Google client credentials based on user's token version
 * @param {string} userId - The user's ID
 * @returns {Promise<{clientId: string, clientSecret: string}>} - Google client credentials
 */
export async function getGoogleClientCredentials(userId) {
  try {
    // Default to client ID 2
    let clientId = 2;
    
    // If userId is provided, try to get the user's token version
    if (userId) {
      try {
        // Use the admin client to fetch user data
        const { data: userData, error: userError } = await supabaseAdmin
          .from('users')
          .select('google_token_version')
          .eq('id', userId)
          .single();
        
        if (userError) {
          console.error('Error fetching user data:', userError);
          // Continue with default client ID 2
        } else if (userData?.google_token_version === 'gmail_only') {
          clientId = 3;
        }
      } catch (userFetchError) {
        console.error('Error in user data fetch:', userFetchError);
        // Continue with default client ID 2
      }
    }
    
    // Fetch the client credentials from google_clients table
    const { data: clientData, error: clientError } = await supabaseAdmin
      .from('google_clients')
      .select('client_id, client_secret')
      .eq('id', clientId)
      .single();
    
    if (clientError) {
      console.error('Error fetching Google client data:', clientError);
      throw new Error('Failed to fetch Google client credentials');
    }
    
    return {
      clientId: clientData.client_id,
      clientSecret: clientData.client_secret
    };
  } catch (error) {
    console.error('Error in getGoogleClientCredentials:', error);
    throw error;
  }
} 