import { alpha } from '@mui/material/styles';

export const brand = {
  50: 'hsl(210, 100%, 95%)', // very light
  100: 'hsl(210, 100%, 90%)',
  200: 'hsl(210, 100%, 80%)',
  300: '#8B8B8B',
  400: '#414141',
  500: '#414141', // original color
  600: 'hsl(210, 98%, 35%)',
  700: 'hsl(210, 100%, 30%)', // darker
  800: 'hsl(210, 100%, 20%)',
  900: 'hsl(210, 100%, 15%)', // very dark
};

export const gray = {
  10: '#FCFCFC',
  50: '#C8C8C8',
  100: '#E1E1E1',
  200: '#8B8B8B',
  300: 'hsl(220, 20%, 80%)',
  400: '#8B8B8B',
  500: 'hsl(220, 20%, 42%)',
  600: '#8B8B8B',
  700: '#414141',
  800: '#414141',
  900: 'hsl(220, 35%, 3%)',
};

export const green = {
  50: 'hsl(120, 80%, 98%)',
  100: 'hsl(120, 75%, 94%)',
  200: 'hsl(120, 75%, 87%)',
  300: 'hsl(120, 61%, 77%)',
  400: 'hsl(120, 44%, 53%)',
  500: 'hsl(120, 59%, 30%)',
  600: 'hsl(120, 70%, 25%)',
  700: 'hsl(120, 75%, 16%)',
  800: 'hsl(120, 84%, 10%)',
  900: 'hsl(120, 87%, 6%)',
};

export const orange = {
  50: 'hsl(45, 100%, 97%)',
  100: 'hsl(45, 92%, 90%)',
  200: 'hsl(45, 94%, 80%)',
  300: 'hsl(45, 90%, 65%)',
  400: 'hsl(45, 90%, 40%)',
  500: 'hsl(45, 90%, 35%)',
  600: 'hsl(45, 91%, 25%)',
  700: 'hsl(45, 94%, 20%)',
  800: 'hsl(45, 95%, 16%)',
  900: 'hsl(45, 93%, 12%)',
};

export const red = {
  50: 'hsl(0, 100%, 97%)',
  100: 'hsl(0, 92%, 90%)',
  200: 'hsl(0, 94%, 80%)',
  300: 'hsl(0, 90%, 65%)',
  400: '#FF6A6A',
  500: 'hsl(0, 90%, 30%)',
  600: 'hsl(0, 91%, 25%)',
  700: 'hsl(0, 94%, 18%)',
  800: 'hsl(0, 95%, 12%)',
  900: 'hsl(0, 93%, 6%)',
};

export const colorSchemes = {
  light: {
    palette: {
      primary: {
        light: brand[200],
        main: brand[400],
        dark: brand[700],
        contrastText: brand[50],
      },
      info: {
        light: brand[100],
        main: brand[300],
        dark: brand[600],
        contrastText: gray[50],
      },
      warning: {
        light: orange[300],
        main: orange[400],
        dark: orange[800],
      },
      error: {
        light: red[300],
        main: red[400],
        dark: red[800],
      },
      success: {
        light: green[300],
        main: green[400],
        dark: green[800],
      },
      common: {
        black: gray[700],
      },
      grey: {
        ...gray,
      },
      divider: alpha(gray[300], 0.4),
      background: {
        default: 'hsl(0, 0%, 99%)',
        paper: 'hsl(220, 35%, 97%)',
      },
      text: {
        primary: gray[800],
        secondary: gray[600],
        warning: orange[400],
      },
      action: {
        hover: alpha(gray[200], 0.2),
        selected: `${alpha(gray[200], 0.3)}`,
      },
      baseShadow: 'hsla(220, 30%, 5%, 0.07) 0px 4px 16px 0px, hsla(220, 25%, 10%, 0.07) 0px 8px 16px -5px',
    },
  },
  dark: {
    palette: {
      primary: {
        light: brand[200],
        main: brand[400],
        dark: brand[700],
        contrastText: brand[50],
      },
      info: {
        light: brand[100],
        main: brand[300],
        dark: brand[600],
        contrastText: gray[50],
      },
      warning: {
        light: orange[300],
        main: orange[400],
        dark: orange[800],
      },
      error: {
        light: red[300],
        main: red[400],
        dark: red[800],
      },
      success: {
        light: green[300],
        main: green[400],
        dark: green[800],
      },
      common: {
        black: gray[900],
        white: gray[10],
      },
      grey: {
        ...gray,
      },
      divider: alpha(gray[700], 0.4),
      background: {
        default: 'hsl(220, 25%, 9%)',
        paper: 'hsl(220, 25%, 12%)',
      },
      text: {
        primary: gray[10],
        secondary: gray[300],
        warning: orange[400],
      },
      action: {
        hover: alpha(gray[200], 0.08),
        selected: alpha(gray[200], 0.12),
      },
      baseShadow: 'hsla(220, 30%, 5%, 0.3) 0px 4px 16px 0px, hsla(220, 25%, 10%, 0.2) 0px 8px 16px -5px',
    },
  },
};

export default colorSchemes;
