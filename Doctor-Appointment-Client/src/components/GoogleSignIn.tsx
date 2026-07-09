import { useEffect, useRef, useState } from "react";
import { api } from "../services/api";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            element: HTMLElement | null,
            options: {
              theme: string;
              size: string;
              shape: string;
              width?: number;
            },
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

interface GoogleSignInProps {
  onSuccess: () => void;
  onError: (message: string) => void;
  loading?: boolean;
}

export function GoogleSignIn({
  onSuccess,
  onError,
  loading,
}: GoogleSignInProps) {
  const btnRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
  const demoClientId =
    "990339570472-k6nqn1tpmitg8pui82bfaun3jrpmiuhs.apps.googleusercontent.com";
  const isConfigured = Boolean(
    clientId &&
    !clientId.includes("your-google-client-id") &&
    clientId !== demoClientId,
  );

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Load the GSI script if not present
    if (!document.getElementById("gsi-script")) {
      const script = document.createElement("script");
      script.id = "gsi-script";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initializeGSI;
      document.body.appendChild(script);
    } else if (window.google?.accounts) {
      initializeGSI();
    }

    function initializeGSI() {
      if (!window.google?.accounts || !btnRef.current) return;

      if (!isConfigured) {
        setIsReady(false);
        return;
      }

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      window.google.accounts.id.renderButton(btnRef.current, {
        theme: "outline",
        size: "large",
        shape: "rectangular",
        width: 320,
      });
      setIsReady(true);
    }

    async function handleCredentialResponse(response: { credential: string }) {
      try {
        const res = await api.post<{
          success: boolean;
          message: string;
          data?: {
            user: {
              id: string;
              email: string;
              role: string;
              firstName: string;
              lastName: string;
            };
          };
        }>("/auth/google", { credential: response.credential });

        if (res.success && res.data) {
          onSuccess();
        } else {
          onError(res.message || "Google sign-in failed");
        }
      } catch (error) {
        const message =
          error instanceof Error && error.message
            ? error.message
            : "Google sign-in failed. Please try again.";
        onError(message);
      }
    }
  }, [clientId, isConfigured, onSuccess, onError]);

  const handleButtonClick = () => {
    if (!isConfigured) {
      onError(
        "There is some problem with Google sign-in configuration. Please contact support or try once again.",
      );
      return;
    }

    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
      return;
    }

    onError("Google sign-in is still loading. Please try again in a moment.");
  };

  return (
    <div
      style={{ minHeight: "40px", display: "flex", justifyContent: "center" }}
    >
      {isConfigured ? (
        <div ref={btnRef} style={{ width: "100%", maxWidth: 320 }} />
      ) : (
        <button
          type="button"
          onClick={handleButtonClick}
          style={{
            border: "1px solid #d0d7de",
            borderRadius: "6px",
            padding: "10px 14px",
            background: "#fff",
            cursor: "pointer",
            fontSize: "0.95rem",
            color: "#1f2328",
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            boxShadow: "0 1px 2px rgba(15, 23, 42, 0.06)",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.5 24.5c0-1.56-.14-3.06-.39-4.5H24v8.99h12.44c-.54 2.9-2.18 5.36-4.65 7.02l7.19 5.59C43.93 37.19 46.5 31.25 46.5 24.5z"
            />
            <path
              fill="#FBBC05"
              d="M10.54 27.41A14.5 14.5 0 0 1 10.54 20.59l-7.98-6.19A23.99 23.99 0 0 0 0 24c0 3.87.93 7.53 2.56 10.78l7.98-6.19z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.47 0 11.9-2.14 15.87-5.81l-7.19-5.59c-2.01 1.35-4.58 2.16-8.68 2.16-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            />
          </svg>
          Continue with Google
        </button>
      )}
      {loading && !isReady && (
        <p style={{ color: "#666", fontSize: "0.85rem", marginLeft: "8px" }}>
          Loading Google Sign-In...
        </p>
      )}
    </div>
  );
}
