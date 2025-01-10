import { Typography, Chip, IconButton, Box, styled, Theme, SxProps, Menu, MenuItem, Tooltip } from '@mui/material';
import InsertLinkRoundedIcon from '@mui/icons-material/InsertLinkRounded';
import React, { useEffect, useState } from 'react';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { EventResponse } from '@quickmeet/shared';
import MeetingRoomRoundedIcon from '@mui/icons-material/MeetingRoomRounded';
import StairsIcon from '@mui/icons-material/Stairs';
import AccessTimeFilledRoundedIcon from '@mui/icons-material/AccessTimeFilledRounded';
import EventSeatRoundedIcon from '@mui/icons-material/EventSeatRounded';
import { convertToLocaleTime } from '@helpers/utility';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

const ListItem = styled('li')(({ theme }) => ({
  margin: theme.spacing(0.3),
}));

export const createChips = (event: EventResponse) => {
  const chips = [];

  if (!event) {
    return [];
  }

  if (event.start && event.end) {
    chips.push({
      label: convertToLocaleTime(event.start) + ' - ' + convertToLocaleTime(event.end),
      icon: <AccessTimeFilledRoundedIcon fontSize="small" />,
    });
  }

  if (event.seats) {
    chips.push({
      label: event.seats.toString(),
      icon: <EventSeatRoundedIcon fontSize="small" />,
    });
  }

  if (event.room) {
    chips.push({
      label: event.room,
      icon: <MeetingRoomRoundedIcon fontSize="small" />,
    });
  }

  if (event.floor) {
    chips.push({
      label: event.floor,
      icon: <StairsIcon fontSize="small" />,
    });
  }

  if (event.meet) {
    let locationIcon = <InsertLinkRoundedIcon fontSize="small" />;

    let tooltip = '';
    let domain = '-';
    let clickable = false;

    try {
      const url = new URL(event.meet);
      domain = url.hostname;
      clickable = true;
    } catch (error) {
      if (event.meet.length > 15) {
        tooltip = event.meet;
        domain = event.meet.slice(0, 15) + '...';
      } else {
        domain = event.meet;
      }

      locationIcon = <LocationOnRoundedIcon fontSize="small" />;
    }

    chips.push({
      label: domain,
      value: event.meet,
      icon: locationIcon,
      clickable,
      tooltip,
      hasMeetingLink: true,
    });
  }

  if (event.attendees?.length) {
    chips.push({
      label: event.attendees.length.toString(),
      icon: <EmailRoundedIcon fontSize="small" />,
    });
  }

  return chips;
};

interface EventCardProps {
  sx?: SxProps<Theme>;
  event: EventResponse;
  onDelete: (id?: string) => void;
  handleEditClick: (id: string) => void;
  disabled?: boolean;
  hideMenu?: boolean;
}

interface ChipData {
  icon: React.ReactElement;
  label: string;
  color?: string;
  clickable?: boolean;
  value?: string;
  tooltip?: string;
  hasMeetingLink?: boolean;
}

const EventCard = ({ sx, event, onDelete, handleEditClick, hideMenu }: EventCardProps) => {
  const [chips, setChips] = useState<ChipData[]>([]);
  const [isOngoingEvent, setIsOngoingEvent] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  useEffect(() => {
    const startInMs = new Date(event.start!).getTime();
    const endInMs = new Date(event.end!).getTime();
    const currentTimeInMs = Date.now();

    if (currentTimeInMs >= startInMs && currentTimeInMs <= endInMs) {
      setIsOngoingEvent(true);
    } else {
      setIsOngoingEvent(false);
    }

    const chips: ChipData[] = createChips(event);
    setChips(chips);
  }, [event]);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const onEditClick = () => {
    handleEditClick(event.eventId!);
    setAnchorEl(null);
  };

  const handleDeleteClick = () => {
    onDelete(event!.eventId);
    setAnchorEl(null);
  };

  const onCopyMeetingLinkClick = (value: string) => {
    navigator.clipboard.writeText(value);
  };

  return (
    <Box
      sx={{
        ...sx,
      }}
    >
      <Box display={'flex'} alignItems="flex-start" pl={2}>
        <Typography
          variant="h5"
          component="div"
          sx={[
            (theme) => ({
              textAlign: 'left',
              color: event.summary ?? theme.palette.grey[400],
              fontStyle: event.summary ?? 'italic',
            }),
          ]}
        >
          {event?.summary || 'No title'}
        </Typography>
        {isOngoingEvent && <FiberManualRecordIcon fontSize="small" sx={{ pl: 1 }} color="success" />}
        <Box flexGrow={1} />

        {/* Options menu */}

        {!hideMenu && (
          <IconButton
            aria-label="more"
            id="basic-button"
            aria-controls={open ? 'basic-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
            onClick={handleClick}
            sx={{ p: 0, mr: 1 }}
          >
            <MoreHorizIcon />
          </IconButton>
        )}

        <Menu
          id="basic-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={() => setAnchorEl(null)}
          MenuListProps={{
            'aria-labelledby': 'basic-button',
          }}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          slotProps={{
            paper: {
              style: {
                width: '15ch',
              },
            },
          }}
        >
          <MenuItem onClick={onEditClick}>Edit</MenuItem>
          <MenuItem onClick={handleDeleteClick}>Delete</MenuItem>
        </Menu>
      </Box>

      <Box
        component="ul"
        sx={{
          display: 'flex',
          justifyContent: 'left',
          flexWrap: 'wrap',
          listStyle: 'none',
          p: 0,
          m: 0,
          mt: 1,
          px: 2,
        }}
      >
        {chips.map((chip, i) => {
          return (
            <ListItem key={i} sx={{ mt: 0.4 }}>
              <Tooltip title={chip.tooltip}>
                <Chip
                  icon={chip.icon}
                  label={chip.label}
                  sx={{
                    fontSize: 15,
                    backgroundColor: '#EFEFEF',
                    cursor: chip.clickable ? 'pointer' : 'auto',
                    px: 0.5,
                    py: 1,
                  }}
                  onClick={() => {
                    if (chip.clickable) {
                      window.open(chip.value, '_blank');
                    }
                  }}
                  deleteIcon={
                    chip.hasMeetingLink ? (
                      <Tooltip title="Copy meeting link">
                        <ContentCopyIcon sx={{ scale: 0.7 }} />
                      </Tooltip>
                    ) : undefined
                  }
                  onDelete={chip.hasMeetingLink ? () => onCopyMeetingLinkClick(chip.value!) : undefined}
                />
              </Tooltip>
            </ListItem>
          );
        })}
      </Box>
    </Box>
  );
};

export default EventCard;
