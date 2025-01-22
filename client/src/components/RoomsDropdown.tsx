import { Box, MenuItem, Select, SelectChangeEvent, Skeleton, Typography } from '@mui/material';
import { ReactElement } from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { IConferenceRoom } from '@quickmeet/shared';
import { useLocales } from '@/config/i18n';

interface DropdownProps {
  id: string;
  sx?: any;
  options?: RoomsDropdownOption[];
  value?: string;
  disabled?: boolean;
  onChange: (id: string, value: string) => void;
  icon?: ReactElement;
  placeholder?: string;
  loading?: boolean;
  currentRoom?: IConferenceRoom;
}

export interface RoomsDropdownOption {
  text: string;
  value: string; // the main value used for api calls
  seats: number;
  floor: string;
  isBusy?: boolean;
}

export default function RoomsDropdown({ sx, id, disabled, currentRoom, value, options, onChange, icon, placeholder, loading }: DropdownProps) {
  const height = '58px';

  const handleChange = (event: SelectChangeEvent) => {
    onChange(id, event.target.value);
  };
  const { locale } = useLocales();

  return (
    <Select
      value={value}
      onChange={handleChange}
      fullWidth
      displayEmpty
      variant="standard"
      disabled={disabled || false}
      renderValue={(selected) => {
        if (!loading && options?.length === 0) {
          return (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {icon && icon}

              <Typography
                variant="subtitle2"
                sx={[
                  (theme) => ({
                    color: theme.palette.grey[500],
                    fontStyle: 'italic',
                    ml: 2,
                    fontWeight: 400,
                  }),
                ]}
              >
                {locale.info.noRooms}
              </Typography>
            </Box>
          );
        }
        const selectedOption = options?.find((option) => option.value === selected);

        if (placeholder && selected.length === 0) {
          return (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {icon && icon}
              {loading ? (
                <Skeleton
                  animation="wave"
                  sx={{
                    width: '100%',
                    mx: 2,
                    borderRadius: 0.5,
                  }}
                />
              ) : (
                <Typography
                  variant="subtitle2"
                  sx={[
                    (theme) => ({
                      color: theme.palette.grey[500],
                      fontStyle: 'italic',
                      ml: 2,
                      fontWeight: 400,
                    }),
                  ]}
                >
                  {placeholder}
                </Typography>
              )}
            </Box>
          );
        }

        return (
          <Box
            sx={{
              alignItems: 'center',
              display: 'flex',
            }}
          >
            {icon && icon}
            {loading ? (
              <Skeleton
                animation="wave"
                sx={{
                  width: '100%',
                  mx: 2,
                  borderRadius: 0.5,
                }}
              />
            ) : (
              <Typography
                variant="subtitle1"
                sx={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  ml: 2,
                }}
              >
                {selectedOption ? selectedOption.text : ''}
              </Typography>
            )}
          </Box>
        );
      }}
      disableUnderline={true}
      sx={[
        (theme) => ({
          height: height,
          backgroundColor: theme.palette.common.white,
          paddingLeft: 1.5,
          paddingRight: 1.5,
          '& .MuiSelect-icon': {
            paddingRight: 1.5,
            color: theme.palette.grey[50],
          },
          ...sx,
        }),
      ]}
    >
      {placeholder && (
        <MenuItem disabled value="" sx={{ pt: 0 }}>
          <em>{placeholder}</em>
        </MenuItem>
      )}
      {options?.map((option, i) => (
        <MenuItem value={option.value} key={i}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            {/* Left section */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{
                  textDecoration: option.isBusy ? 'line-through' : 'inherit',
                }}
              >
                {option.text}
              </Typography>
              {currentRoom && option.value === currentRoom.email && <CheckCircleIcon color="success" sx={{ ml: 1 }} />}
            </Box>

            {/* Right section */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Typography
                variant="body2"
                sx={[
                  (theme) => ({
                    color: theme.palette.grey[200],
                  }),
                ]}
              >
                {option.seats} {option.seats > 1 ? 'persons' : 'person'}
              </Typography>
              <Typography variant="body2">{option.floor}</Typography>
            </Box>
          </Box>
        </MenuItem>
      ))}
    </Select>
  );
}
