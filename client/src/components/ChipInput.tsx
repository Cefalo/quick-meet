import { useState } from 'react';
import { TextField, Chip, Box } from '@mui/material';
import { validateEmail } from '@helpers/utility';
import { toast } from 'react-hot-toast';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';

interface ChipInputProps {
  id: string;
  sx?: any;
  value?: any[];
  disabled?: boolean;
  onChange: (id: string, value: string[]) => void;
  type?: string;
}

export default function ChipInput({ id, sx, onChange, value, type }: ChipInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [chips, setChips] = useState<any[]>(value || []);

  const handleKeyDown = (event: any) => {
    if (event.key === 'Backspace' && inputValue === '' && chips.length > 0) {
      const newChips = chips.slice(0, -1);
      setChips(newChips);
      onChange(id, newChips);
    } else if ((event.key === 'Enter' || event.key === ' ') && inputValue.trim() !== '') {
      if (validateEmail(inputValue.trim())) {
        const newChips = [...chips, inputValue.trim()];
        setChips(newChips);
        setInputValue('');

        onChange(id, newChips);
      } else {
        toast.error('Invalid email address');
      }
    }
  };

  const handleDelete = (chipToDelete: any[]) => {
    const newChips = chips.filter((chip) => chip !== chipToDelete);
    setChips(newChips);
    onChange(id, newChips);
  };

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
      <PeopleAltRoundedIcon
        sx={[
          (theme) => ({
            color: theme.palette.grey[50],
          }),
        ]}
      />
      {chips.map((chip, index) => (
        <Chip
          key={index}
          label={chip}
          onDelete={() => handleDelete(chip)}
          sx={[
            (theme) => ({
              backgroundColor: theme.palette.grey[100],
              color: theme.palette.common.black,
              fontSize: '14px',
            }),
          ]}
        />
      ))}

      <TextField
        variant="standard"
        type={type}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={value && value.length > 0 ? '' : 'Invite attendees'}
        slotProps={{
          input: {
            disableUnderline: true,
          },
        }}
        sx={[
          (theme) => ({
            flex: 1,
            py: 0,
            px: 0.5,
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
}
