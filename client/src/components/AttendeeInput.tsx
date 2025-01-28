import { useApi } from '@/context/ApiContext';
import { isEmailValid } from '@/helpers/utility';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import { Autocomplete, Box, Chip, debounce, TextField, Typography } from '@mui/material';
import Avatar from '@mui/material/Avatar';
import { IPeopleInformation } from '@quickmeet/shared';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface AttendeeInputProps {
  id: string;
  value?: any[];
  disabled?: boolean;
  onChange: (id: string, value: IPeopleInformation[]) => void;
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
    const filteredEmails = emails
      .join(' ')
      .split(/\s+/)
      .map((email) => email.trim())
      .filter((email) => email !== '');

    const uniqueEmails = [...new Set(filteredEmails)];
    const validPeople: IPeopleInformation[] = [];
    const invalidEmails: string[] = [];

    uniqueEmails.forEach((email) => {
      if (isEmailValid(email)) {
        const existingPerson = newValue.find((option) => typeof option === 'object' && option.email === email) as IPeopleInformation;
        if (existingPerson) {
          validPeople.push(existingPerson);
        } else {
          const firstPartOfEmail = email.split('@')[0];
          validPeople.push({ name: firstPartOfEmail, email, photo: '' });
        }
      } else {
        invalidEmails.push(email);
      }
    });

    invalidEmails.length > 0 && toast.error('Invalid email(s) entered.');

    if (validPeople.length >= 0) {
      onChange(id, validPeople);
    }
    setTextInput('');
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
          renderTags={(value: readonly IPeopleInformation[], getTagProps) =>
            value.map((option, index) => {
              const { key, ...tagProps } = getTagProps({ index });
              return (
                <Chip
                  avatar={
                    <Avatar
                      alt={option.email}
                      src={option.photo}
                      sx={[
                        (theme) => ({
                          bgcolor: theme.palette.grey[50],
                        }),
                      ]}
                    />
                  }
                  variant="outlined"
                  label={option.name}
                  key={key}
                  {...tagProps}
                />
              );
            })
          }
          renderInput={(params) => (
            <TextField
              {...params}
              onChange={(e) => setTextInput(e.target.value)}
              type={type}
              variant="standard"
              placeholder="Attendees"
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
