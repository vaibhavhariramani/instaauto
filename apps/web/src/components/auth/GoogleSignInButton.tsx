import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@/api/auth';
import { extractErrorMessage } from '@/api/client';
import { ROUTES } from '@/constants/routes';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

const SCRIPT_ID = 'google-identity-services';

function loadGsiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById(SCRIPT_ID)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
}

export function GoogleSignInButton() {
  const buttonRef = useRef<HTMLDivElement>(null);
  const googleLogin = useGoogleLogin();
  const navigate = useNavigate();

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.warn('VITE_GOOGLE_CLIENT_ID is not set — Google Sign-In button will not render.');
      return;
    }

    let cancelled = false;
    loadGsiScript()
      .then(() => {
        if (cancelled || !window.google || !buttonRef.current) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            try {
              await googleLogin.mutateAsync(response.credential);
              navigate(ROUTES.onboardingProfile);
            } catch (err) {
              toast.error(extractErrorMessage(err));
            }
          },
        });
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          width: 320,
          shape: 'pill',
          text: 'continue_with',
        });
      })
      .catch(() => toast.error('Could not load Google Sign-In. Check your connection and try again.'));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center gap-3">
      <div ref={buttonRef} />
      {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
        <p className="max-w-xs text-center text-xs text-muted-foreground">
          Set <code>VITE_GOOGLE_CLIENT_ID</code> in <code>apps/web/.env</code> to enable Google Sign-In.
        </p>
      )}
    </div>
  );
}
