import { OAuth2Client } from "google-auth-library";
console.log("Google OAuth Config:", {
  clientIdLoaded: Boolean(process.env.GOOGLE_CLIENT_ID),
  clientSecretLoaded: Boolean(process.env.GOOGLE_CLIENT_SECRET),
});

const googleClient = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  redirectUri: "http://localhost:3000/auth/google/callback",
});

export default googleClient;