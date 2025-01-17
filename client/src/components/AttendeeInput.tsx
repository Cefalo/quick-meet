import { TextField, Chip, Box, Autocomplete, debounce } from '@mui/material';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import { useState } from 'react';
import { useApi } from '@/context/ApiContext';
import { isEmailValid } from '@/helpers/utility';
import toast from 'react-hot-toast';
import Avatar from '@mui/material/Avatar';
import { Typography } from '@mui/material';
import type { IPeopleInformation } from '@quickmeet/shared';

interface AttendeeInputProps {
  id: string;
  value?: any[];
  disabled?: boolean;
  onChange: (id: string, value: string[]) => void;
  type?: string;
}

export default function AttendeeInput({ id, onChange, value, type }: AttendeeInputProps) {
  const [options, setOptions] = useState<IPeopleInformation[]>([]);
  const [textInput, setTextInput] = useState('');

  const api = useApi();

  const handleInputChange = async (_: React.SyntheticEvent, newInputValue: string) => {
    if (newInputValue.length > 2) {
      const res = await api.searchPeople(newInputValue);
      if (res.status === 'success') {
        setOptions((res.data as IPeopleInformation[]) || []);
      }
    }
  };

  const handleSelectionChange = (_: React.SyntheticEvent, newValue: Array<string | IPeopleInformation>) => {
    const emails = newValue.map((option) => (typeof option === 'object' && option.email ? option.email : (option as string)));
    const filteredEmails = emails.filter((email) => emails.indexOf(email) === emails.lastIndexOf(email));
    if (filteredEmails.length > 0) {
      const lastValue = filteredEmails[filteredEmails.length - 1].trim();
      if (isEmailValid(lastValue)) {
        onChange(id, filteredEmails);
        setTextInput('');
      } else {
        toast.error('Invalid email entered');
      }
    } else {
      onChange(id, filteredEmails);
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
          getOptionLabel={(option) => (typeof option === 'object' && option.email ? option.email : '')}
          noOptionsText=""
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
            value.map((email: string, index: number) => {
              const { key, ...tagProps } = getTagProps({ index });
              return <Chip variant="filled" label={email} key={key} {...tagProps} />;
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
          renderOption={(props, option) => {
            const { key, ...optionProps } = props;
            const isSelected = value?.includes(option.email);
            return (
              <Box
                key={key}
                component="li"
                sx={[
                  (theme) => ({
                    '& > img': { mr: 2, flexShrink: 0 },
                    backgroundColor: isSelected ? theme.palette.grey[100] : 'transparent',
                  }),
                ]}
                {...optionProps}
                gap={1}
              >
                <Avatar src={option.photo} alt={`Image of ${option.name}`} />
                <Box sx={{ width: '80%' }}>
                  <Typography variant="subtitle2" noWrap={true}>
                    {option.name}
                  </Typography>
                  <Typography variant="subtitle2" color="text.secondary" noWrap={true}>
                    {option.email}
                  </Typography>
                </Box>
              </Box>
            );
          }}
        />
      </Box>
    </Box>
  );
}
