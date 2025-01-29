import { Box, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import TopNavigationBar from './TopNavigationBar';
import BookRoomView from './BookRoomView';
import MyEventsView from './MyEventsView';
import { Link, useLocation } from 'react-router-dom';
import CelebrationRoundedIcon from '@mui/icons-material/CelebrationRounded';

const ExtensionRedirectPrompt = () => {
  return (
    <Box
      sx={{
        flexGrow: 1,
        position: 'relative',
      }}
    >
      <Box
        display={'flex'}
        alignItems={'center'}
        sx={{
          flexDirection: 'column',
          zIndex: 100,
          mt: 20,
          px: 4,
        }}
      >
        <CelebrationRoundedIcon fontSize="large" />
        <Typography variant="h5" mt={2}>
          You're all set!
        </Typography>
        <Typography fontSize="1em" mt={2}>
          Jump back into the extension to get started, or you may explore the{' '}
          <Link to={'/'} onClick={() => window.location.reload()}>
            webapp
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default function Home() {
  const [tabIndex, setTabIndex] = useState(0);
  const { state } = useLocation();
  const [redirectedDate, setRedirectedDate] = useState<string | undefined>();
  const [extensionRedirectMessage, setExtensionRedirectMessage] = useState(null);

  useEffect(() => {
    const message = state?.message;
    setExtensionRedirectMessage(message);
  }, []);

  const onRoomBooked = (date?: string) => {
    setTabIndex(1);
    setRedirectedDate(date);
  };

  const handleTabChange = (newValue: number) => {
    setTabIndex(newValue);
  };

  if (extensionRedirectMessage) {
    return <ExtensionRedirectPrompt />;
  }

  return (
    <Box
      sx={{
        flexGrow: 1,
        overflowY: 'auto',
        paddingBottom: '56px',
        position: 'relative',
      }}
    >
      <Box
        display={'flex'}
        alignItems={'center'}
        sx={{
          zIndex: 100,
        }}
      >
        <TopNavigationBar
          sx={{
            pr: 1,
          }}
          tabIndex={tabIndex}
          handleTabChange={handleTabChange}
        />
      </Box>
      {tabIndex === 0 && <BookRoomView onRoomBooked={onRoomBooked} />}
      {tabIndex === 1 && <MyEventsView redirectedDate={redirectedDate} />}
    </Box>
  );
}
