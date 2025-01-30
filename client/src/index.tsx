import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { StyledEngineProvider } from '@mui/material/styles';
import { secrets } from './config/secrets';
import './styles.css';
import { PreferencesProvider } from './context/PreferencesContext';
import { ApiProvider } from '@/context/ApiContext';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

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
