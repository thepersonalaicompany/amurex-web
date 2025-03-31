import { supabase } from '@/lib/supabaseClient';

/**
 * Get the appropriate Google client credentials based on user's token version
 * @param {string} userId - The user's ID
 * @returns {Promise<{clientId: string, clientSecret: string}>} - Google client credentials
 */
export async function getGoogleClientCredentials(userId) {
  try {
    // First, check the user's google_token_version
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('google_token_version')
      .eq('id', userId)
      .single();
    
    if (userError) {
      console.error('Error fetching user data:', userError);
      throw new Error('Failed to fetch user data');
    }
    
    // Determine which client ID to use based on token version
    let clientId = 2; // Default to ID 2 for NULL or 'old'
    
    if (userData.google_token_version === 'gmail_only') {
      clientId = 3;
    }
    
    // Fetch the client credentials from google_clients table
    const { data: clientData, error: clientError } = await supabase
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