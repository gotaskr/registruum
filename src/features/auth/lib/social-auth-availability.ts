/**
 * Google / LinkedIn OAuth is intended for the deployed site only.
 * Local `next dev` keeps email + password as the only sign-in path.
 */
export function isSocialAuthEnabled(): boolean {
  return process.env.NODE_ENV === "production";
}
