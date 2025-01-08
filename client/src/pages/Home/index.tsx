import { Box } from '@mui/material';
import { useEffect, useState } from 'react';
import TopNavigationBar from './TopNavigationBar';
import BookRoomView from './BookRoomView';
import MyEventsView from './MyEventsView';
import { useApi } from '@/context/ApiContext';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes';

export default function Home() {
  const [tabIndex, setTabIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const api = useApi();
  const navigate = useNavigate();

  useEffect(() => {
    const validate = async () => {
      const res = await api.validateSession();
      if (!res) {
        navigate(ROUTES.signIn);
      }

      setLoading(false);
    };

    validate();
  }, []);

  const onRoomBooked = () => {
    setTabIndex(1);
  };

  const handleTabChange = (newValue: number) => {
    setTabIndex(newValue);
  };

  if (loading) return <></>;

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
      {tabIndex === 1 && <MyEventsView />}
    </Box>
  );
}
