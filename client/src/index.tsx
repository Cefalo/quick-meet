import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { StyledEngineProvider } from '@mui/material/styles';
import { secrets } from './config/secrets';
import './styles.css';
import { PreferencesProvider } from './context/PreferencesContext';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <StyledEngineProvider injectFirst>
    <BrowserRouter basename={secrets.appEnvironment === 'chrome' ? '/index.html' : ''}>
      <PreferencesProvider>
        <App />
      </PreferencesProvider>
    </BrowserRouter>
  </StyledEngineProvider>,
);
