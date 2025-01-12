// only used for the web version

import { ROUTES } from '@/config/routes';
import { useApi } from '@/context/ApiContext';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// for chrome extension, a different oauth flow is used using the chrome api
export default function OAuth() {
  const navigate = useNavigate();
  const api = useApi();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');
      const state = url.searchParams.get('state') as 'web' | 'chrome' | null;

      if (error || !code) {
        navigate(ROUTES.signIn, { state: { message: error }, replace: true });
        return;
      }

      const res = await api.handleOAuthCallback(code);
      if (res.status === 'error') {
        navigate(ROUTES.signIn, { state: { message: res.message || 'Something went wrong' }, replace: true });
        return;
      }

      navigate(ROUTES.home, { state: { message: state === 'chrome' ? "You're all set! You can now return to the extension and start using it." : null } });
    };

    handleOAuthCallback();
  }, [navigate]);

  return <></>;
}
