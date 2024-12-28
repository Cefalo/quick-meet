// https://vite.dev/guide/env-and-mode.html
export const secrets = {
  nodeEnvironment: import.meta.env.MODE,
  appEnvironment: import.meta.env.VITE_ENVIRONMENT,
  mockCalender: import.meta.env.VITE_MOCK_CALENDER,
  backendEndpoint: import.meta.env.VITE_BACKEND_ENDPOINT,
  appSlogan: import.meta.env.VITE_APP_SLOGAN,
  appTitle: import.meta.env.VITE_APP_TITLE,
};
