import { Amplify } from "aws-amplify";
import { config } from "../config/config.js";

// Only aws-amplify/auth is imported elsewhere: the full package drags in storage,
// analytics and API modules we do not use.
export function configureAuth(): void {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: config.cognitoUserPoolId,
        userPoolClientId: config.cognitoClientId,
      },
    },
  });
}
