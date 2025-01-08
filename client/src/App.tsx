import { Outlet, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import AppTheme from './theme/AppTheme';
import { Toaster } from 'react-hot-toast';
import { FONT_PRIMARY } from './theme/primitives/typography';
import { ROUTES } from './config/routes';
import Settings from '@/pages/Settings';
import BaseLayout from '@/pages/BaseLayout';
import OAuth from '@/pages/Oauth';

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
