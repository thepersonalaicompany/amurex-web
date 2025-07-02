import { google, Auth } from "googleapis";

interface getOauth2ClientProps {
  client_id: string;
  client_secret: string;
}

if (
  !process.env.GOOGLE_REDIRECT_URI ||
  process.env.GOOGLE_REDIRECT_URI === "" ||
  !process.env.GOOGLE_CLIENT_ID ||
  !process.env.GOOGLE_CLIENT_SECRET
)
  throw new Error("Missing GOOGLE_REDIRECT_URI");

// When userData is passed in, we are using the client credentials from Supabase
// When userData is not passed in, we are using the default client credentials

export const getOauth2Client = ({
  userData,
}: {
  userData?: getOauth2ClientProps;
}): Auth.OAuth2Client => {
  if (userData) {
    return new google.auth.OAuth2(
      userData.client_id,
      userData.client_secret,
      process.env.GOOGLE_REDIRECT_URI,
    );
  } else {
    return new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );
  }
};
