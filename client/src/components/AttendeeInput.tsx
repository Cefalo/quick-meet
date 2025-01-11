import { TextField, Chip, Box, Autocomplete, debounce, IconButton } from '@mui/material';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import { useState } from 'react';
import { useApi } from '@/context/ApiContext';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { isEmailValid } from '@/helpers/utility';
import toast from 'react-hot-toast';

interface AttendeeInputProps {
  id: string;
  value?: any[];
  disabled?: boolean;
  onChange: (id: string, value: string[]) => void;
  type?: string;
}

// const StyledPopper = styled(Popper)(({ theme }) => ({
//   '& .MuiAutocomplete-paper': {
//     backgroundColor: 'rgba(245, 245, 245)',
//     color: theme.palette.text.primary,
//     boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
//     borderRadius: theme.shape.borderRadius,
//     padding: theme.spacing(0.5),
//   },
//   '& .MuiAutocomplete-listbox': {
//     padding: 0,
//     display: 'flex',
//     flexDirection: 'column',
//   },
//   '& .MuiAutocomplete-option': {
//     padding: theme.spacing(1.5),
//     borderRadius: theme.shape.borderRadius,
//   },
// }));

export default function AttendeeInput({ id, onChange, value, type }: AttendeeInputProps) {
  const [options, setOptions] = useState<string[]>([]);
  const [textInput, setTextInput] = useState('');

  const api = useApi();

  const handleInputChange = async (_: React.SyntheticEvent, newInputValue: string) => {
    if (newInputValue.length > 2) {
      const res = await api.searchPeople(newInputValue);
      if (res.status === 'success') {
        setOptions(res.data || []);
      }
    }
  };

  const handleSelectionChange = (_: React.SyntheticEvent, newValue: string[]) => {
    if (newValue.length > 0) {
      const lastValue = newValue[newValue.length - 1].trim();
      if (isEmailValid(lastValue)) {
        onChange(id, newValue);
        setTextInput('');
      } else {
        toast.error('Invalid email entered');
      }
    } else {
      onChange(id, newValue);
      setTextInput('');
    }
  };

  const handleKeyDown = (event: any) => {
    if (event.key === ' ') {
      event.preventDefault();
      const inputValue = event.target.value.trim();
      const existingEmails = value || [];

      if (existingEmails.find((email) => email === inputValue)) {
        toast.error('Duplicate email entered');
        return;
      }

      if (!isEmailValid(inputValue)) {
        toast.error('Invalid email entered');
        return;
      }

      onChange(id, [...existingEmails, inputValue]);
      setTextInput('');
    }
  };

  const onRemoveAllClick = () => {
    onChange(id, []);
  };

  const debouncedInputChange = debounce(handleInputChange, 300);

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
          maxHeight: '65px',
          overflowY: 'auto',
        }),
      ]}
    >
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          mx: 1,
        }}
      >
        <PeopleAltRoundedIcon
          sx={[
            (theme) => ({
              color: theme.palette.grey[50],
              position: 'sticky',
              top: 0,
              bottom: 0,
            }),
          ]}
        />
        <Autocomplete
          multiple
          options={options}
          value={value || []}
          getOptionLabel={(option) => option}
          freeSolo
          inputValue={textInput}
          fullWidth
          onChange={handleSelectionChange}
          slotProps={{
            listbox: {
              sx: {
                backgroundColor: 'rgba(245, 245, 245)',
                '& .MuiAutocomplete-option': {
                  padding: 1,
                  mx: 1,
                  borderRadius: 1,
                },
              },
            },
            popper: {
              sx: {
                boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
              },
            },
          }}
          onInputChange={debouncedInputChange}
          renderTags={(value: readonly string[], getTagProps) =>
            value.map((option: string, index: number) => {
              const { key, ...tagProps } = getTagProps({ index });
              return <Chip variant="filled" label={option} key={key} {...tagProps} />;
            })
          }
          renderInput={(params) => (
            <TextField
              {...params}
              onChange={(e) => setTextInput(e.target.value)}
              type={type}
              variant="standard"
              placeholder="Attendees"
              onKeyDown={handleKeyDown}
              slotProps={{
                input: {
                  ...params.InputProps,
                  endAdornment: null,
                },
              }}
              sx={[
                (theme) => ({
                  flex: 1,
                  py: 0,
                  px: 1,
                  '& .MuiInputBase-input': {
                    fontSize: theme.typography.subtitle1,
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: theme.palette.primary.main,
                    fontSize: theme.typography.subtitle1,
                  },
                  '& .MuiInput-underline:before, & .MuiInput-underline:hover:before': {
                    borderBottom: 'none !important',
                  },
                  '& .MuiInput-underline:after': {
                    borderBottom: 'none',
                  },
                }),
              ]}
            />
          )}

          // PopperComponent={StyledPopper}
        />
        <IconButton
          sx={{
            position: 'sticky',
            p: 0.5,
            top: 0,
            bottom: 0,
            display: (value || []).length > 0 ? 'flex' : 'none',
          }}
          onClick={onRemoveAllClick}
        >
          <CloseRoundedIcon
            fontSize="small"
            sx={[
              (theme) => ({
                color: theme.palette.grey[50],
              }),
            ]}
          />
        </IconButton>
      </Box>
    </Box>
  );
}
