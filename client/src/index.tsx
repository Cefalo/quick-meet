import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { StyledEngineProvider } from '@mui/material/styles';
import { secrets } from './config/secrets';
import './styles.css';
import { PreferencesProvider } from './context/PreferencesContext';
import { ApiProvider } from '@/context/ApiContext';
import { initI18n } from '@/config/i18n';
initI18n();
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <StyledEngineProvider injectFirst>
    <BrowserRouter basename={secrets.appEnvironment === 'chrome' ? '/index.html' : ''}>
      <PreferencesProvider>
        <ApiProvider>
          <App />
        </ApiProvider>
      </PreferencesProvider>
    </BrowserRouter>
  </StyledEngineProvider>,
);
