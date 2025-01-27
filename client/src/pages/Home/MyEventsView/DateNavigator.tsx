import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import { Box, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { ReactNode } from 'react';

interface DateNavigatorProps {
  children: ReactNode;
  onPrevClick: () => void;
  onNextClick: () => void;
}

const StyledButton = styled(IconButton)(({ theme }) => ({
  boxShadow: 'none',
  '&:hover, &:focus, &:active': {
    backgroundColor: 'transparent',
    boxShadow: 'none',
    color: theme.palette.primary.main,
  },
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const DateNavigator: React.FC<DateNavigatorProps> = ({ children, onPrevClick, onNextClick }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        mb: 1,
      }}
    >
      <StyledButton size="small" onClick={onPrevClick}>
        <KeyboardArrowLeft sx={{ fontSize: 30 }} />
      </StyledButton>
      {children}
      <StyledButton size="small" onClick={onNextClick}>
        <KeyboardArrowRight sx={{ fontSize: 30 }} />
      </StyledButton>
    </Box>
  );
};

export default DateNavigator;
