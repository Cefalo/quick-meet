import { Box, TextField } from '@mui/material';
import { ReactElement } from 'react';

interface StyledTextFieldProps {
  id: string;
  sx?: any;
  value?: string;
  placeholder?: string;
  startIcon?: ReactElement;
  onChange: (id: string, value: string) => void;
}

const StyledTextField = ({ id, sx, startIcon, onChange, value, placeholder }: StyledTextFieldProps) => {
  return (
    <Box
      display="flex"
      alignItems="center"
      flexWrap="wrap"
      sx={[
        (theme) => ({
          gap: '8px',
          padding: '10px',
          borderRadius: 1,
          backgroundColor: theme.palette.common.white,
          '&:focus-within': {
            border: 'none',
          },
          ...sx,
        }),
      ]}
    >
      {startIcon}
      <TextField
        onChange={(e) => onChange(id, e.target.value)}
        variant="standard"
        value={value}
        placeholder={placeholder}
        slotProps={{
          input: {
            disableUnderline: true,
          },
        }}
        fullWidth
        sx={[
          (theme) => ({
            flex: 1,
            px: 0.5,
            py: 0,
            '& .MuiInputBase-input': {
              fontSize: theme.typography.subtitle1,
            },
            '& .MuiInputBase-input::placeholder': {
              color: theme.palette.primary,
              fontSize: theme.typography.subtitle1,
            },
          }),
        ]}
      />
    </Box>
  );
};

export default StyledTextField;
