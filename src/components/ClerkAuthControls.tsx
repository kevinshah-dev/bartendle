"use client";

import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";

export function ClerkAuthControls() {
  const { isLoaded, isSignedIn } = useUser();
  const authRedirectUrl =
    typeof window === "undefined" ? "/" : window.location.href;

  if (isLoaded && isSignedIn) {
    return (
      <div className="clerk-auth-controls" aria-live="polite">
        <div className="clerk-user-button">
          <UserButton />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`clerk-auth-controls${isLoaded ? "" : " clerk-auth-controls-disabled"}`}
      aria-live="polite"
    >
      <SignInButton
        mode="modal"
        forceRedirectUrl={authRedirectUrl}
        fallbackRedirectUrl={authRedirectUrl}
        signUpForceRedirectUrl={authRedirectUrl}
        signUpFallbackRedirectUrl={authRedirectUrl}
      >
        <button className="auth-button auth-button-secondary" disabled={!isLoaded} type="button">
          Sign In
        </button>
      </SignInButton>
      <SignUpButton
        mode="modal"
        forceRedirectUrl={authRedirectUrl}
        fallbackRedirectUrl={authRedirectUrl}
        signInForceRedirectUrl={authRedirectUrl}
        signInFallbackRedirectUrl={authRedirectUrl}
      >
        <button className="auth-button" disabled={!isLoaded} type="button">
          Sign Up
        </button>
      </SignUpButton>
    </div>
  );
}
