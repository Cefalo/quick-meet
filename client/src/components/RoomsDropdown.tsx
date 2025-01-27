import { Box, ListSubheader, MenuItem, Select, SelectChangeEvent, Skeleton, styled, Typography } from '@mui/material';
import { ReactElement } from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { IConferenceRoom } from '@quickmeet/shared';
import { IAvailableRoomsDropdownOption } from '@/helpers/types';

interface DropdownProps {
  id: string;
  sx?: any;
  options: IAvailableRoomsDropdownOption;
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

const renderMenuItem = (option: RoomsDropdownOption, currentRoom?: IConferenceRoom) => {
  return (
    <MenuItem value={option.value} key={option.value}>
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
  );
};

const StyledHintTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.grey[500],
  fontStyle: 'italic',
  fontWeight: 400,
}));

const RenderNoRooms = ({ icon }: { icon?: ReactElement }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {icon && icon}

      <StyledHintTypography ml={2} variant="subtitle2">
        No rooms available
      </StyledHintTypography>
    </Box>
  );
};

const RenderPlaceholder = ({ icon, loading, placeholder }: { icon?: ReactElement; loading?: boolean; placeholder?: string }) => {
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
        <StyledHintTypography ml={2} variant="subtitle2">
          {placeholder}
        </StyledHintTypography>
      )}
    </Box>
  );
};

const RenderSelectText = ({ icon, loading, selectedOption }: { icon?: ReactElement; loading?: boolean; selectedOption?: RoomsDropdownOption }) => {
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
};

export default function RoomsDropdown({ sx, id, disabled, currentRoom, value, options, onChange, icon, placeholder, loading }: DropdownProps) {
  const height = '58px';

  const handleChange = (event: SelectChangeEvent) => {
    onChange(id, event.target.value);
  };

  return (
    <Select
      value={value}
      onChange={handleChange}
      fullWidth
      displayEmpty
      variant="standard"
      disabled={disabled || false}
      renderValue={(selected) => {
        if (!loading && options.others.length === 0 && options.preferred.length === 0) {
          return <RenderNoRooms icon={icon} />;
        }

        const selectedOption = [...options.preferred, ...options.others].find((option) => option.value === selected);
        if (placeholder && selected.length === 0) {
          return <RenderPlaceholder icon={icon} loading={loading} placeholder={placeholder} />;
        }

        return <RenderSelectText icon={icon} loading={loading} selectedOption={selectedOption} />;
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
        <MenuItem disabled value="" sx={{ pt: 1 }}>
          <em>{placeholder}</em>
        </MenuItem>
      )}

      {options.preferred.map((option) => renderMenuItem(option, currentRoom))}

      {options.others.length > 0 && (
        <ListSubheader>
          <StyledHintTypography sx={{ my: 0.5 }}>Less preferred rooms</StyledHintTypography>
        </ListSubheader>
      )}
      {options.others.map((option) => renderMenuItem(option, currentRoom))}
    </Select>
  );
}
