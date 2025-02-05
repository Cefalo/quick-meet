import AttendeeInput from '@/components/AttendeeInput';
import StyledTextField from '@/components/StyledTextField';
import { useApi } from '@/context/ApiContext';
import { usePreferences } from '@/context/PreferencesContext';
import Dropdown, { DropdownOption } from '@components/Dropdown';
import RoomsDropdown, { RoomsDropdownOption } from '@components/RoomsDropdown';
import {
  chromeBackground,
  convertToLocaleDate,
  convertToLocaleTime,
  convertToRFC3339,
  createDropdownOptions,
  getTimeZoneString,
  isChromeExt,
  populateDurationOptions,
  populateRoomCapacity,
  populateTimeOptions,
  renderError,
} from '@helpers/utility';
import AccessTimeFilledRoundedIcon from '@mui/icons-material/AccessTimeFilledRounded';
import ArrowBackIosRoundedIcon from '@mui/icons-material/ArrowBackIosRounded';
import EventSeatRoundedIcon from '@mui/icons-material/EventSeatRounded';
import HourglassBottomRoundedIcon from '@mui/icons-material/HourglassBottomRounded';
import MeetingRoomRoundedIcon from '@mui/icons-material/MeetingRoomRounded';
import TitleIcon from '@mui/icons-material/Title';
import { FormData, IAvailableRoomsDropdownOption } from '@helpers/types';
import { LoadingButton } from '@mui/lab';
import { AppBar, Box, Button, Checkbox, IconButton, Skeleton, Stack, Typography } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import dayjs from 'dayjs';
import 'dayjs/locale/en-gb';
import { useEffect, useRef, useState } from 'react';
import { EventResponse, IConferenceRoom, IAvailableRooms, IPeopleInformation } from '@quickmeet/shared';
import { useNavigate } from 'react-router-dom';
import DatePickerPopper from '@/pages/Home/MyEventsView/DatePickerPopper';

const createRoomDropdownOptions = (rooms: IConferenceRoom[]) => {
  return (rooms || []).map((room) => ({ value: room.email, text: room.name, seats: room.seats, floor: room.floor }) as RoomsDropdownOption);
};

const calcDuration = (start: string, end: string) => {
  const _start = new Date(start);
  const _end = new Date(end);

  const duration = (_end.getTime() - _start.getTime()) / (1000 * 60);
  return duration;
};

const initFormData = (event: EventResponse) => {
  return {
    startTime: convertToLocaleTime(event.start!),
    duration: calcDuration(event.start!, event.end!),
    seats: event.seats,
    room: event.roomEmail,
    attendees: event.attendees,
    title: event.summary,
    conference: Boolean(event.meet),
    eventId: event.eventId,
  } as FormData;
};

interface EditEventsViewProps {
  open: boolean;
  handleClose: () => void;
  event: EventResponse;
  onEditConfirmed: (data: FormData) => void;
  editLoading?: boolean;
  currentRoom?: IConferenceRoom;
}

export default function EditEventsView({ open, event, handleClose, currentRoom, onEditConfirmed, editLoading }: EditEventsViewProps) {
  // Context or global state
  const { preferences } = usePreferences();

  // Dropdown options state
  const [timeOptions, setTimeOptions] = useState<DropdownOption[]>([]);
  const [durationOptions, setDurationOptions] = useState<DropdownOption[]>([]);
  const [roomCapacityOptions, setRoomCapacityOptions] = useState<DropdownOption[]>([]);
  const [availableRoomOptions, setAvailableRoomOptions] = useState<IAvailableRoomsDropdownOption>({ others: [], preferred: [] });

  // Loading and advanced options state
  const [roomLoading, setRoomLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form data state
  const [formData, setFormData] = useState<FormData>(initFormData(event));

  const [date, setDate] = useState(dayjs(event.start!));
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [datePickerAnchorEl, setDatePickerAnchorEl] = useState<null | HTMLElement>(null);

  // Utilities and hooks
  const api = useApi();
  const abortControllerRef = useRef<AbortController | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // abort pending requests on component unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    setPreferences();
  }, []);

  useEffect(() => {
    if (roomCapacityOptions.length > 0) {
      setAvailableRooms();
    }
  }, [date, formData.startTime, formData.duration, formData.seats, roomCapacityOptions]);

  const handleInputChange = (id: string, value: string | number | string[] | IPeopleInformation[] | boolean) => {
    setFormData((prevData) => ({
      ...prevData,
      [id]: value,
    }));
  };

  async function setAvailableRooms() {
    const { startTime, duration, seats } = formData;
    const { floor } = preferences;
    const currentDate = convertToLocaleDate(new Date(date.toISOString()).toISOString());
    const formattedStartTime = convertToRFC3339(currentDate, startTime);

    setRoomLoading(true);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const res = await api.getAvailableRooms(abortControllerRef.current.signal, formattedStartTime, duration, getTimeZoneString(), seats, floor, event.eventId);
    setRoomLoading(false);

    if (res.status === 'ignore') {
      return;
    }

    if (res.status === 'error') {
      return renderError(res, navigate);
    }

    const data = res.data as IAvailableRooms;

    let preferredRoomOptions: RoomsDropdownOption[] = [];
    let unPreferredRoomOptions: RoomsDropdownOption[] = [];

    if (!data || [...data.preferred, ...data.others].length === 0) {
      setAvailableRoomOptions({ others: unPreferredRoomOptions, preferred: preferredRoomOptions });
      return;
    }

    if (currentRoom) {
      const filteredPreferredRooms = data.preferred.filter((item) => item.email !== currentRoom.email);
      const filteredUnPreferredRooms = data.others.filter((item) => item.email !== currentRoom.email);

      preferredRoomOptions = createRoomDropdownOptions(filteredPreferredRooms);
      unPreferredRoomOptions = createRoomDropdownOptions(filteredUnPreferredRooms);

      const isCurrentRoomAvailable = [...data.preferred, ...data.others].some((room) => room.email === currentRoom.email);
      const currentRoomOption = createRoomDropdownOptions([currentRoom])[0];

      if (!isCurrentRoomAvailable) {
        currentRoomOption.isBusy = true;
      }

      if (data.preferred.find((d) => d.email === currentRoom.email)) {
        preferredRoomOptions.unshift(currentRoomOption);
      } else {
        unPreferredRoomOptions.unshift(currentRoomOption);
      }
    } else {
      preferredRoomOptions = createRoomDropdownOptions(data.preferred);
      unPreferredRoomOptions = createRoomDropdownOptions(data.others);
      const roomEmail = (data.preferred?.[0] || data.others?.[0])?.email;

      setFormData((prev) => {
        return {
          ...prev,
          room: roomEmail,
        };
      });
    }

    setAvailableRoomOptions({ others: unPreferredRoomOptions, preferred: preferredRoomOptions });
  }

  const handleDatePopperClick = (event: React.MouseEvent<HTMLElement>) => {
    setDatePickerAnchorEl(event.currentTarget);
    setDatePickerOpen(true);
  };

  async function setPreferences() {
    const eventTime = new Date(event.start!);
    const currentTime = new Date(new Date().toUTCString());

    const res = await api.getMaxSeatCount();

    const capacities = populateRoomCapacity(res?.data || 0);
    const durations = populateDurationOptions();

    const minTime = eventTime < currentTime ? eventTime : currentTime;

    setTimeOptions(createDropdownOptions(populateTimeOptions(minTime.toISOString())));
    setDurationOptions(createDropdownOptions(durations, 'time'));
    setRoomCapacityOptions(createDropdownOptions(capacities));

    setLoading(false);
  }

  const onSaveClick = () => {
    const updatedEvent = {
      ...formData,
      date: date.toISOString(),
    };
    setFormData(updatedEvent);
    onEditConfirmed(updatedEvent);
  };

  if (loading) return <></>;
  if (!open) return <></>;

  const background = isChromeExt ? chromeBackground : { background: 'linear-gradient(180deg, #FFFFFF 0%, rgba(255, 255, 255, 0.6) 100%)' };

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '100%',
        zIndex: 1,
        boxShadow: 'none',
        overflow: 'hidden',
        ...background,
      }}
    >
      <AppBar
        sx={{ bgcolor: 'transparent', position: 'relative', display: 'flex', flexDirection: 'row', py: 2, alignItems: 'center', px: 3, boxShadow: 'none' }}
      >
        <IconButton edge="start" color="inherit" onClick={handleClose} aria-label="close">
          <ArrowBackIosRoundedIcon
            fontSize="small"
            sx={[
              (theme) => ({
                color: theme.palette.common.black,
              }),
            ]}
          />
        </IconButton>
        <Typography
          sx={[
            (theme) => ({
              textAlign: 'center',
              flex: 1,
              color: theme.palette.common.black,
              fontWeight: 700,
            }),
          ]}
          variant="h5"
          component={'div'}
        >
          Edit event
        </Typography>
      </AppBar>

      {editLoading ? (
        <Box mx={3}>
          <Stack spacing={2} mt={3}>
            <Skeleton animation="wave" variant="rounded" height={80} />
            <Skeleton animation="wave" variant="rounded" height={80} />
          </Stack>
        </Box>
      ) : (
        <Box
          sx={{
            mx: 2,
          }}
        >
          <Box
            sx={{
              px: 1,
              background: isChromeExt ? 'rgba(255, 255, 255, 0.4)' : 'rgba(245, 245, 245, 0.5);',
              backdropFilter: 'blur(100px)',
              py: 1,
              borderRadius: 2,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                flexDirection: 'row',
                backgroundColor: (theme) => theme.palette.common.white,
                border: 'none',
                width: '100%',
              }}
            >
              <Box sx={{ width: '50%' }}>
                <Dropdown
                  id="startTime"
                  options={timeOptions}
                  value={formData.startTime}
                  onChange={handleInputChange}
                  sx={{
                    borderTopLeftRadius: 10,
                    borderTopRightRadius: 10,
                  }}
                  icon={
                    <AccessTimeFilledRoundedIcon
                      sx={[
                        (theme) => ({
                          color: theme.palette.grey[50],
                        }),
                      ]}
                    />
                  }
                />
              </Box>
              <Box sx={{ flex: 1, display: 'flex' }}>
                <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                  <IconButton aria-label="calender" size="small" onClick={handleDatePopperClick}>
                    <CalendarMonthIcon
                      sx={[
                        (theme) => ({
                          color: theme.palette.grey[50],
                        }),
                      ]}
                      fontSize="medium"
                    />
                  </IconButton>
                  <Typography
                    sx={{
                      cursor: 'pointer',
                      ml: 2,
                    }}
                    variant="subtitle1"
                    onClick={handleDatePopperClick}
                  >
                    {date.format('DD/MM/YYYY')}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ display: 'flex' }}>
              <Dropdown
                id="duration"
                options={durationOptions}
                value={formData.duration.toString()}
                onChange={handleInputChange}
                icon={
                  <HourglassBottomRoundedIcon
                    sx={[
                      (theme) => ({
                        color: theme.palette.grey[50],
                      }),
                    ]}
                  />
                }
              />
              <Dropdown
                id="seats"
                options={roomCapacityOptions}
                value={formData.seats?.toString()}
                onChange={handleInputChange}
                icon={
                  <EventSeatRoundedIcon
                    sx={[
                      (theme) => ({
                        color: theme.palette.grey[50],
                      }),
                    ]}
                  />
                }
              />
            </Box>
            <RoomsDropdown
              id="room"
              options={availableRoomOptions}
              value={formData.room || (availableRoomOptions.preferred?.[0] || availableRoomOptions.others?.[0])?.value || ''}
              disabled={![...availableRoomOptions.preferred, ...availableRoomOptions.others].length}
              placeholder={[...availableRoomOptions.preferred, ...availableRoomOptions.others].length === 0 ? 'No rooms are available' : 'Select your room'}
              loading={roomLoading}
              currentRoom={currentRoom}
              onChange={handleInputChange}
              icon={
                <MeetingRoomRoundedIcon
                  sx={[
                    (theme) => ({
                      color: theme.palette.grey[50],
                    }),
                  ]}
                />
              }
            />

            <Box>
              <Box
                sx={{
                  bgcolor: 'white',
                  borderBottomLeftRadius: 15,
                  borderBottomRightRadius: 15,
                }}
              >
                <StyledTextField
                  value={formData.title}
                  placeholder={preferences.title}
                  id="title"
                  onChange={handleInputChange}
                  sx={{ mx: 0.5 }}
                  startIcon={
                    <TitleIcon
                      sx={[
                        (theme) => ({
                          color: theme.palette.grey[50],
                        }),
                      ]}
                    />
                  }
                />
                <AttendeeInput id="attendees" onChange={handleInputChange} value={formData.attendees} type="email" />
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  my: 2,
                }}
              >
                <Checkbox checked={formData.conference} value={formData.conference} onChange={(e) => handleInputChange('conference', e.target.checked)} />
                <Typography variant="subtitle1" ml={0.5}>
                  Create meet link
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box flexGrow={1} />
        </Box>
      )}

      <Box
        sx={{
          mx: 4,
          mb: 2,
          textAlign: 'center',
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        <LoadingButton
          onClick={onSaveClick}
          fullWidth
          variant="contained"
          disableElevation
          loading={editLoading}
          loadingPosition="start"
          startIcon={<></>}
          sx={[
            (theme) => ({
              py: 2,
              backgroundColor: theme.palette.common.white,
              borderRadius: 15,
              color: theme.palette.common.black,
              textTransform: 'none',
            }),
          ]}
        >
          <Typography variant="h6" fontWeight={700}>
            Save changes
          </Typography>
        </LoadingButton>

        <Button
          variant="text"
          onClick={handleClose}
          sx={{
            py: 1,
            mt: 1.5,
            px: 3,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
            '&:active': {
              boxShadow: 'none',
            },
            '&:focus': {
              boxShadow: 'none',
            },
          }}
        >
          <Typography variant="subtitle2" fontWeight={700}>
            Cancel
          </Typography>
        </Button>
      </Box>
      <DatePickerPopper
        disablePast={true}
        currentDate={date}
        setCurrentDate={setDate}
        open={datePickerOpen}
        setOpen={setDatePickerOpen}
        anchorEl={datePickerAnchorEl}
      />
    </Box>
  );
}
