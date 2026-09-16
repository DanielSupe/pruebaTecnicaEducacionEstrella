import { CognitoJwtVerifier } from "aws-jwt-verify";
import type { AppConfig } from "../config/env.js";

// The two options that matter for security are not the signature, which the
// library always checks, but these:
//
// - tokenUse "access": without it, a valid ID token would pass. The ID token
//   describes the user to the client; the access token authorises calling us.
//
// - clientId: a token signed by THIS same user pool but issued for another client
//   is cryptographically valid. Checking the signature answers "the token is
//   genuine"; we must answer "the token is for me".
export function createAccessTokenVerifier(
  config: Pick<AppConfig, "cognitoUserPoolId" | "cognitoClientId">,
) {
  return CognitoJwtVerifier.create({
    userPoolId: config.cognitoUserPoolId,
    tokenUse: "access",
    clientId: config.cognitoClientId,
  });
}
