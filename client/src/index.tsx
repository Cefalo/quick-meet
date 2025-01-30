import { initI18n } from '@/config/i18n';
import { ApiProvider } from '@/context/ApiContext';
import { StyledEngineProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { secrets } from './config/secrets';
import { PreferencesProvider } from './context/PreferencesContext';
import './styles.css';
initI18n();

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <StyledEngineProvider injectFirst>
    <BrowserRouter basename={secrets.appEnvironment === 'chrome' ? '/index.html' : ''}>
      <PreferencesProvider>
        <ApiProvider>
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
            <App />
          </LocalizationProvider>
        </ApiProvider>
      </PreferencesProvider>
    </BrowserRouter>
  </StyledEngineProvider>,
);
