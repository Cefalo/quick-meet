import { chromeBackground, isChromeExt } from '@/helpers/utility';
import { Stack, styled } from '@mui/material';
import { ReactNode } from 'react';
import MuiCard from '@mui/material/Card';

const ChromeContainer = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  textAlign: 'center',
  paddingBottom: 0,
  gap: theme.spacing(2),
  width: '480px',
  height: '600px',
  ...chromeBackground,
  overflow: 'hidden',
  borderRadius: isChromeExt ? 0 : 'auto',
}));

const WebContainer = styled(Stack)(({ theme: _ }) => ({
  textAlign: 'center',
  minHeight: '100vh',
  justifyContent: 'center',
  position: 'relative',
  overflow: 'hidden',
  ...chromeBackground,
}));

const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexGrow: 1,
  position: 'relative',
  justifyContent: 'flex-end',
  flexDirection: 'column',
  alignSelf: 'center',
  textAlign: 'center',
  width: '100%',
  maxHeight: '620px',
  borderRadius: 20,
  boxShadow: '0 8px 20px 0 rgba(0,0,0,0.1)',
  background: 'linear-gradient(180deg, #FFFFFF 0%, rgba(255, 255, 255, 0.6) 100%)',
  border: 'none',
  [theme.breakpoints.up('sm')]: {
    maxWidth: '450px',
  },
  [theme.breakpoints.down('sm')]: {
    maxWidth: '390px',
  },
  zIndex: 1,
}));

interface BaseLayoutProps {
  children: ReactNode;
}

const BaseLayout = ({ children }: BaseLayoutProps) => {
  // web view
  if (!isChromeExt) {
    return (
      <WebContainer direction="column" justifyContent="space-between">
        <Card variant="outlined">{children}</Card>
      </WebContainer>
    );
  }

  // chrome view
  return <ChromeContainer>{children}</ChromeContainer>;
};

export default BaseLayout;
