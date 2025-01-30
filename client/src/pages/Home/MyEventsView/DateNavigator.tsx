import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import { Box, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';
import Grid from '@mui/material/Grid2';

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
}));

const DateNavigator: React.FC<DateNavigatorProps> = ({ children, onPrevClick, onNextClick }) => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid
        container
        spacing={3}
        sx={{
          alignItems: 'center',
        }}
      >
        <Grid size="grow">
          <StyledButton size="small" onClick={onPrevClick}>
            <KeyboardArrowLeft sx={{ fontSize: 30 }} />
          </StyledButton>
        </Grid>
        <Grid size={6}>{children}</Grid>
        <Grid size="grow">
          <StyledButton size="small" onClick={onNextClick}>
            <KeyboardArrowRight sx={{ fontSize: 30 }} />
          </StyledButton>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DateNavigator;
