import { Box, Button, Chip, Divider, Fade, List, ListItem, Paper, Popper } from '@mui/material';
import { StaticDatePicker, PickersShortcutsItem, PickersShortcutsProps } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { useState } from 'react';

// https://mui.com/x/react-date-pickers/shortcuts/
const shortcutItems: PickersShortcutsItem<unknown>[] = [
  {
    label: 'Reset',
    getValue: () => {
      return dayjs(new Date());
    },
  },
];

function DatePickerShortcuts(props: PickersShortcutsProps<dayjs.Dayjs | null>) {
  const { items, onChange, isValid, changeImportance = 'set' } = props;

  if (items == null || items.length === 0) {
    return null;
  }

  const resolvedItems = items.map((item) => {
    const newValue = item.getValue({ isValid });

    return {
      label: item.label,
      onClick: () => {
        onChange(newValue, changeImportance, item);
      },
      disabled: !isValid(newValue),
    };
  });

  return (
    <Box
      sx={{
        gridRow: 1,
        gridColumn: 2,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
      }}
    >
      <List
        dense
        sx={(theme) => ({
          display: 'flex',
          px: theme.spacing(1),
          '& .MuiListItem-root': {
            pl: 0,
            pr: theme.spacing(1),
            py: 0,
          },
        })}
      >
        {resolvedItems.map((item) => {
          return (
            <ListItem key={item.label}>
              <Chip {...item} />
            </ListItem>
          );
        })}
      </List>
      <Divider />
    </Box>
  );
}

interface DatePickerPopperProps {
  currentDate: dayjs.Dayjs;
  setCurrentDate: React.Dispatch<React.SetStateAction<dayjs.Dayjs>>;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const DatePickerPopper = ({ open, setOpen, currentDate, setCurrentDate }: DatePickerPopperProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    setOpen((prev) => !prev);
  };

  return (
    <Box>
      <Button onClick={handleClick}>Open Date Picker</Button>

      <Popper sx={{ zIndex: 1200 }} open={open} anchorEl={anchorEl} placement="bottom" transition>
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={350}>
            <Box
              sx={{
                boxShadow: (theme) => theme.shadows[8],
              }}
            >
              <StaticDatePicker
                onChange={(newDate, context) => {
                  if (!context?.shortcut) {
                    if (newDate) {
                      setCurrentDate(newDate);
                      setOpen(false);
                    }
                  }
                }}
                value={currentDate}
                slots={{
                  shortcuts: DatePickerShortcuts,
                  actionBar: undefined,
                }}
                slotProps={{
                  shortcuts: {
                    items: shortcutItems,
                    changeImportance: 'set',
                  },
                }}
                sx={{
                  '.MuiPickersToolbar-root': {
                    display: 'none',
                  },
                  '.MuiPickersLayout-actionBar': {
                    display: 'none',
                  },
                  '.MuiDateCalendar-root': {
                    borderBottomLeftRadius: 20,
                    borderBottomRightRadius: 20,
                  },
                }}
              />
            </Box>
          </Fade>
        )}
      </Popper>
    </Box>
  );
};

export default DatePickerPopper;
