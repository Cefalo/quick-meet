import { Box, MenuItem, Select, SelectChangeEvent, Skeleton, Typography } from '@mui/material';
import { ReactElement } from 'react';

interface DropdownProps {
  id: string;
  sx?: any;
  options?: DropdownOption[];
  value?: string;
  disabled?: boolean;
  onChange: (id: string, value: string) => void;
  decorator?: string;
  icon?: ReactElement;
  placeholder?: string;
  loading?: boolean;
}

export interface DropdownOption {
  text: string;
  value: string; // the main value used for API calls
}

export default function Dropdown({ sx, id, disabled, value, options, onChange, decorator, icon, placeholder, loading }: DropdownProps) {
  const height = '60px';

  const validValue = options?.find((option) => option.value === value) ? value : '';

  const getRenderValue = (selected: string) => {
    const selectedOption = options?.find((option) => option.value === selected);

    if (placeholder && (!selected || selected.length === 0)) {
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
        <Typography
          variant="subtitle1"
          sx={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            ml: 2,
          }}
        >
          {selectedOption ? selectedOption.text + (decorator || '') : '-'}
        </Typography>
      </Box>
    );
  };

  const handleChange = (event: SelectChangeEvent) => {
    onChange(id, event.target.value);
  };

  return (
    <Select
      value={validValue}
      onChange={handleChange}
      fullWidth
      displayEmpty
      variant="standard"
      disabled={disabled || false}
      renderValue={getRenderValue}
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
        <MenuItem disabled value="">
          <em>{placeholder}</em>
        </MenuItem>
      )}

      {options?.map((option) => (
        <MenuItem value={option.value} key={option.value}>
          <Typography variant="subtitle1">
            {option.text}
            {decorator}
          </Typography>
        </MenuItem>
      ))}
    </Select>
  );
}
