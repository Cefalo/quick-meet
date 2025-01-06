import { Box } from '@mui/material';
import { useState } from 'react';
import TopNavigationBar from './TopNavigationBar';
import BookRoomView from './BookRoomView';
import MyEventsView from './MyEventsView';

export default function Home() {
  const [tabIndex, setTabIndex] = useState(0);

  const onRoomBooked = () => {
    setTabIndex(1);
  };

  const handleTabChange = (newValue: number) => {
    setTabIndex(newValue);
  };

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
