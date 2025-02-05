import { Typography, Chip, IconButton, Box, styled, Theme, SxProps, Menu, MenuItem, Tooltip } from '@mui/material';
import InsertLinkRoundedIcon from '@mui/icons-material/InsertLinkRounded';
import React, { useEffect, useState } from 'react';
import { EventResponse } from '@quickmeet/shared';
import MeetingRoomRoundedIcon from '@mui/icons-material/MeetingRoomRounded';
import StairsIcon from '@mui/icons-material/Stairs';
import AccessTimeFilledRoundedIcon from '@mui/icons-material/AccessTimeFilledRounded';
import EventSeatRoundedIcon from '@mui/icons-material/EventSeatRounded';
import { convertToLocaleTime, isPastDate } from '@helpers/utility';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import PendingOutlinedIcon from '@mui/icons-material/PendingOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import toast from 'react-hot-toast';

const ListItem = styled('li')(({ theme }) => ({
  margin: theme.spacing(0.3),
}));

export const createChips = (event: EventResponse) => {
  const chips: ChipData[] = [];

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
    let endIcon;

    let tooltip = '';
    let domain = '-';
    let clickable = false;
    let hasMeetingLink = false;

    try {
      const url = new URL(event.meet);
      domain = url.hostname;
      clickable = true;
      hasMeetingLink = true;
    } catch (error) {
      if (event.meet.length > 15) {
        tooltip = event.meet;
        domain = event.meet.slice(0, 15) + '...';
      } else {
        domain = event.meet;
      }

      locationIcon = <LocationOnRoundedIcon fontSize="small" />;
    }

    if (hasMeetingLink) {
      endIcon = (
        <Tooltip title="Copy meeting link">
          <ContentCopyIcon sx={{ scale: 0.7 }} />
        </Tooltip>
      );
    }

    chips.push({
      label: domain,
      value: event.meet,
      icon: locationIcon,
      clickable,
      tooltip,
      endIcon,
      action: () => {
        clickable && window.open(event.meet, '_blank');
      },
      endIconAction: () => {
        if (event.meet) {
          navigator.clipboard.writeText(event.meet);
          toast.success('Meeting link copied to clipboard');
        }
      },
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
  disabled?: boolean;
  isEditable?: boolean;
  hideMenu?: boolean;

  onDelete?: (id?: string) => void;
  handleEditClick?: (id: string) => void;
  handleEventResponse?: (eventId: string, response: string) => void;
}

interface ChipData {
  icon: React.ReactElement;
  endIcon?: React.ReactElement;
  label: string;
  color?: string;
  clickable?: boolean;
  value?: string;
  tooltip?: string;
  hasMeetingLink?: boolean;
  endIconAction?: () => void;
  action?: () => void;
}

const EventCard = ({ sx, event, onDelete, handleEditClick, isEditable, handleEventResponse, hideMenu }: EventCardProps) => {
  const [chips, setChips] = useState<ChipData[]>([]);
  const [isOngoingEvent, setIsOngoingEvent] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const [menuItems, setMenuItems] = useState<JSX.Element[]>([]);
  const [responseIcon, setResponseIcon] = useState<JSX.Element>(<CheckCircleIcon fontSize="small" color="success" />);
  const [responseTooltipLabel, setResponseTooltipLabel] = useState<string>('Acccepted');

  const open = Boolean(anchorEl);

  useEffect(() => {
    setOngoingEvent();

    const chips: ChipData[] = createChips(event);
    setChips(chips);

    createMenuItems();

    createResponseIcon();
  }, [event]);

  const setOngoingEvent = () => {
    const startInMs = new Date(event.start!).getTime();
    const endInMs = new Date(event.end!).getTime();
    const currentTimeInMs = Date.now();

    if (currentTimeInMs >= startInMs && currentTimeInMs <= endInMs) {
      setIsOngoingEvent(true);
    } else {
      setIsOngoingEvent(false);
    }
  };

  const createResponseIcon = () => {
    if (event.responseStatus === 'accepted') {
      if (event.isEditable) {
        setResponseIcon(
          <CheckCircleIcon
            color="success"
            sx={{
              fontSize: '16px',
            }}
          />,
        );
        setResponseTooltipLabel('Organizer');
      } else {
        setResponseIcon(
          <CheckCircleOutlineIcon
            color="success"
            sx={{
              fontSize: '16px',
            }}
          />,
        );
        setResponseTooltipLabel('Accepted');
      }
    } else if (event.responseStatus === 'declined') {
      setResponseIcon(
        <CancelOutlinedIcon
          sx={{
            fontSize: '16px',
          }}
          color="error"
        />,
      );
      setResponseTooltipLabel('Declined');
    } else {
      setResponseIcon(
        <PendingOutlinedIcon
          sx={{
            fontSize: '16px',
          }}
          color="warning"
        />,
      );
      setResponseTooltipLabel('Pending');
    }
  };

  const createMenuItems = () => {
    const menuItems: JSX.Element[] = [];
    if (isEditable) {
      menuItems.push(
        <MenuItem key="edit" onClick={onEditClick} disabled={isPastDate(event.start) ? true : false}>
          Edit
        </MenuItem>,
      );
      menuItems.push(
        <MenuItem key="delete" onClick={handleDeleteClick}>
          Delete
        </MenuItem>,
      );
    } else {
      menuItems.push(
        <MenuItem disabled={event.responseStatus === 'accepted'} onClick={onAcceptClick} key="accept">
          Accept
        </MenuItem>,
        <MenuItem disabled={event.responseStatus === 'declined'} onClick={onRejectClick} key="reject">
          Reject
        </MenuItem>,
      );
    }

    setMenuItems(menuItems);
  };

  const handleOptionsMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const onEditClick = () => {
    typeof handleEditClick === 'function' && handleEditClick(event.eventId!);
    setAnchorEl(null);
  };

  const onAcceptClick = () => {
    typeof handleEventResponse === 'function' && handleEventResponse(event.eventId!, 'accepted');
    setAnchorEl(null);
  };

  const onRejectClick = () => {
    typeof handleEventResponse === 'function' && handleEventResponse(event.eventId!, 'declined');
    setAnchorEl(null);
  };

  const handleDeleteClick = () => {
    typeof onDelete === 'function' && onDelete(event.eventId);
    setAnchorEl(null);
  };

  return (
    <Box
      sx={{
        ...sx,
      }}
    >
      <Box display={'flex'} alignItems="flex-start" px={1}>
        <Typography
          variant="h5"
          component="div"
          sx={[
            (theme) => ({
              textAlign: 'left',
              color: event.summary ?? theme.palette.grey[400],
              fontStyle: event.summary ?? 'italic',
              display: 'flex',
              alignItems: 'center',
            }),
          ]}
        >
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            {event?.summary || 'No title'}
            <Tooltip title={responseTooltipLabel}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>{responseIcon}</Box>
            </Tooltip>
          </Box>
        </Typography>

        <Box flexGrow={1} />

        {/* Options menu */}

        {!hideMenu && (
          <>
            {isOngoingEvent ? (
              <Chip label="Ongoing" size="small" variant="outlined" deleteIcon={<MoreHorizIcon />} onDelete={handleOptionsMenuClick} />
            ) : (
              <>
                {
                  <IconButton
                    aria-label="more"
                    id="basic-button"
                    aria-controls={open ? 'basic-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={open ? 'true' : undefined}
                    onClick={handleOptionsMenuClick}
                    sx={{ p: 0, mr: 1 }}
                  >
                    <MoreHorizIcon />
                  </IconButton>
                }
              </>
            )}
          </>
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
          {menuItems.map((item) => item)}
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
          px: 1,
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
                  onClick={chip.action}
                  deleteIcon={chip.endIcon}
                  onDelete={chip.endIcon && chip.endIconAction}
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
