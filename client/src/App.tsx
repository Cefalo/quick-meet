import { Outlet, Route, Routes, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import AppTheme from './theme/AppTheme';
import { Toaster } from 'react-hot-toast';
import { FONT_PRIMARY } from './theme/primitives/typography';
import { useEffect } from 'react';
import { ROUTES } from './config/routes';
import Api from './api/api';
import Settings from '@/pages/Settings';
import BaseLayout from '@/pages/BaseLayout';

// only used for the web version
// for chrome extension, a different oauth flow is used using the chrome api
function OAuth() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');

      if (error) {
        navigate(ROUTES.signIn, { state: { message: error }, replace: true });
        return;
      }

      if (code) {
        const api = new Api();
        const res = await api.handleOAuthCallback(code);
        if (!res) return;

        const { status, message, data } = res;
        if (status !== 'success') {
          navigate(ROUTES.signIn, { state: { message: message || 'Something went wrong' }, replace: true });
          return;
        }

        if (data?.accessToken) {
          navigate(ROUTES.home, { replace: true });
        }
      }
    };

    handleOAuthCallback();
  }, [navigate]);

  return <></>;
}

function App() {
  return (
    <AppTheme>
      <Routes>
        <Route
          element={
            <BaseLayout>
              <Outlet />
            </BaseLayout>
          }
        >
          <Route path={ROUTES.home} element={<Home />} />
          <Route path={ROUTES.signIn} element={<Login />} />
          <Route path={ROUTES.oauth} element={<OAuth />} />
          <Route path={ROUTES.settings} element={<Settings />} />
        </Route>
      </Routes>
      <Toaster
        position="top-center"
        containerStyle={{
          fontFamily: FONT_PRIMARY,
        }}
        toastOptions={{
          error: {
            duration: 5000,
          },
        }}
      />
    </AppTheme>
  );
}

export default App;
