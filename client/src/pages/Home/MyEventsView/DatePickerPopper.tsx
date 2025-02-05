import { Box, Chip, ClickAwayListener, Divider, Fade, GlobalStyles, List, ListItem, Popper } from '@mui/material';
import { StaticDatePicker, PickersShortcutsItem, PickersShortcutsProps, PickerChangeHandlerContext, DateValidationError } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { useEffect, useRef } from 'react';

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
  disablePast?: boolean;
  currentDate: dayjs.Dayjs;
  setCurrentDate: React.Dispatch<React.SetStateAction<dayjs.Dayjs>>;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  anchorEl: HTMLElement | null;
}

const DatePickerPopper = ({ open, setOpen, currentDate, setCurrentDate, anchorEl, disablePast }: DatePickerPopperProps) => {
  const hasMounted = useRef(false);

  useEffect(() => {
    if (!open) {
      hasMounted.current = false;
    }
  }, [open]);

  const handleClickAway = () => {
    // on initial mount, this method gets called. to prevent that, the flag hasMounted has been used
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    setOpen(false);
  };

  const onDateChange = (newDate: dayjs.Dayjs | null, _?: PickerChangeHandlerContext<DateValidationError>) => {
    if (newDate) {
      setCurrentDate(newDate);
      setOpen(false);
    }
  };

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <Popper sx={{ zIndex: 1200 }} open={open} anchorEl={anchorEl} placement="bottom" transition>
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={350}>
            <Box
              sx={{
                boxShadow: (theme) => theme.shadows[8],
                borderRadius: '15px',
              }}
            >
              <GlobalStyles
                styles={{
                  '.MuiPickersLayout-root': {
                    borderRadius: '15px !important',
                  },
                }}
              />
              {/* https://mui.com/x/react-date-pickers/date-picker/#customization */}
              <StaticDatePicker
                disablePast={disablePast}
                onChange={onDateChange}
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
                }}
              />
            </Box>
          </Fade>
        )}
      </Popper>
    </ClickAwayListener>
  );
};

export default DatePickerPopper;
