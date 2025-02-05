import AttendeeInput from '@/components/AttendeeInput';
import StyledTextField from '@/components/StyledTextField';
import { useApi } from '@/context/ApiContext';
import { usePreferences } from '@/context/PreferencesContext';
import Dropdown, { DropdownOption } from '@components/Dropdown';
import RoomsDropdown, { RoomsDropdownOption } from '@components/RoomsDropdown';
import {
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
import EventSeatRoundedIcon from '@mui/icons-material/EventSeatRounded';
import { FormData, IAvailableRoomsDropdownOption } from '@helpers/types';
import { BookRoomDto, EventResponse, IConferenceRoom, IAvailableRooms, IPeopleInformation } from '@quickmeet/shared';
import HourglassBottomRoundedIcon from '@mui/icons-material/HourglassBottomRounded';
import MeetingRoomRoundedIcon from '@mui/icons-material/MeetingRoomRounded';
import TitleIcon from '@mui/icons-material/Title';
import LoadingButton from '@mui/lab/LoadingButton';
import { Box, Checkbox, IconButton, Typography } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import dayjs from 'dayjs';
import 'dayjs/locale/en-gb';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import DatePickerPopper from '@/pages/Home/MyEventsView/DatePickerPopper';

const createRoomDropdownOptions = (rooms: IConferenceRoom[]) => {
  return (rooms || []).map((room) => ({ value: room.email, text: room.name, seats: room.seats, floor: room.floor }) as RoomsDropdownOption);
};

interface BookRoomViewProps {
  onRoomBooked: (date?: string) => void;
}

export default function BookRoomView({ onRoomBooked }: BookRoomViewProps) {
  // Context or global state
  const { preferences } = usePreferences();

  // loading states
  const [bookClickLoading, setBookClickLoading] = useState(false);
  const [roomLoading, setRoomLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initialPageLoad, setInitialPageLoad] = useState(false);

  // dropdown options
  const [timeOptions, setTimeOptions] = useState<DropdownOption[]>([]);
  const [durationOptions, setDurationOptions] = useState<DropdownOption[]>([]);
  const [roomCapacityOptions, setRoomCapacityOptions] = useState<DropdownOption[]>([]);
  const [availableRoomOptions, setAvailableRoomOptions] = useState<IAvailableRoomsDropdownOption>({ others: [], preferred: [] });

  // form data
  const [formData, setFormData] = useState<FormData>({
    startTime: '',
    duration: Number(preferences.duration),
    seats: preferences.seats,
    conference: false,
    room: '',
  });

  const [date, setDate] = useState(dayjs());
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [datePickerAnchorEl, setDatePickerAnchorEl] = useState<null | HTMLElement>(null);

  // Utilities and hooks
  const navigate = useNavigate();
  const abortControllerRef = useRef<AbortController | null>(null);
  const api = useApi();

  useEffect(() => {
    initializeDropdowns().finally(() => {
      setInitialPageLoad(true);
      setLoading(false);
    });

    // abort pending requests on component unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    if (initialPageLoad && formData.startTime) {
      setAvailableRooms();
    }
  }, [initialPageLoad, date, formData.startTime, formData.duration, formData.seats]);

  const handleInputChange = (id: string, value: string | number | string[] | IPeopleInformation[] | boolean) => {
    setFormData((prevData) => ({
      ...prevData,
      [id]: value,
    }));
  };

  const getNearestTime = (timeOptions: string[]) => {
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = Math.floor(now.getMinutes() / 15) * 15;
    const currentTimeInMinutes = currentHours * 60 + currentMinutes;

    let nearestTime = timeOptions[0];
    let smallestDifference = 1440;

    timeOptions.forEach((option) => {
      const [time, modifier] = option.split(' ');
      let [hours, minutes] = time.split(':').map(Number);

      if (modifier === 'PM' && hours !== 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;

      const optionTimeInMinutes = hours * 60 + minutes;
      const difference = Math.abs(optionTimeInMinutes - currentTimeInMinutes);

      if (difference < smallestDifference) {
        smallestDifference = difference;
        nearestTime = option;
      }
    });

    return nearestTime;
  };

  async function initializeDropdowns() {
    const res = await api.getMaxSeatCount();
    if (res.status === 'error') {
      return;
    }

    const capacities = populateRoomCapacity(res?.data || 0);
    const durations = populateDurationOptions();
    const timeOptions = populateTimeOptions();

    setTimeOptions(createDropdownOptions(timeOptions));
    setDurationOptions(createDropdownOptions(durations, 'time'));
    setRoomCapacityOptions(createDropdownOptions(capacities));

    const { duration, seats } = preferences;

    setFormData((p) => ({
      ...p,
      startTime: getNearestTime(timeOptions),
      seats: seats || Number(capacities[0]),
      duration: duration || Number(durations[0]),
    }));

    setInitialPageLoad(true);
  }

  async function setAvailableRooms() {
    const { startTime, duration, seats } = formData;
    const { floor } = preferences;
    const currentDate = date.toISOString().split('T')[0];
    const formattedStartTime = convertToRFC3339(currentDate, startTime);

    setRoomLoading(true);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const res = await api.getAvailableRooms(abortControllerRef.current.signal, formattedStartTime, duration, getTimeZoneString(), seats, floor);

    setRoomLoading(false);

    if (res.status === 'ignore') {
      return;
    }

    if (res.status === 'error') {
      return renderError(res, navigate);
    }

    const data = res.data as IAvailableRooms;

    let roomEmail: string | undefined;
    let preferredRoomOptions: RoomsDropdownOption[] = [];
    let unPreferredRoomOptions: RoomsDropdownOption[] = [];

    if (data.preferred.length > 0 || data.others.length > 0) {
      roomEmail = (data.preferred?.[0] || data.others?.[0])?.email;
      preferredRoomOptions = createRoomDropdownOptions(data.preferred);
      unPreferredRoomOptions = createRoomDropdownOptions(data.others);
    }

    setFormData({
      ...formData,
      room: roomEmail,
    });

    setAvailableRoomOptions({
      preferred: preferredRoomOptions,
      others: unPreferredRoomOptions,
    });
  }

  const handleDatePopperClick = (event: React.MouseEvent<HTMLElement>) => {
    setDatePickerAnchorEl(event.currentTarget);
    setDatePickerOpen(true);
  };

  async function onBookClick() {
    setBookClickLoading(true);
    const { startTime, duration, seats, conference, attendees, title, room } = formData;
    if (!room) {
      return;
    }

    const formattedStartTime = convertToRFC3339(date.toISOString().split('T')[0], startTime);
    const { floor, title: preferredTitle } = preferences;

    const payload: BookRoomDto = {
      startTime: formattedStartTime,
      duration: duration,
      seats: seats,
      floor: floor || undefined,
      timeZone: getTimeZoneString(),
      createConference: conference,
      title: title || preferredTitle,
      room: room,
      attendees: attendees || [],
    };

    const res = await api.createEvent(payload);
    const { data, status } = res;
    setBookClickLoading(false);

    if (status !== 'success') {
      await setAvailableRooms();
      return renderError(res, navigate);
    }

    const { room: roomName } = data as EventResponse;

    toast.success(`${roomName} has been booked!`);

    setAvailableRoomOptions({ others: [], preferred: [] });
    onRoomBooked(date.toISOString());
  }

  if (loading) return <></>;

  return (
    <Box mx={2} display={'flex'}>
      <Box
        sx={{
          background: isChromeExt ? 'rgba(255, 255, 255, 0.4)' : 'rgba(245, 245, 245, 0.5);',
          backdropFilter: 'blur(100px)',
          borderRadius: 2,
          zIndex: 100,
          width: '100%',
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
        <Box>
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
              value={formData.seats.toString()}
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
            loading={roomLoading}
            disabled={![...availableRoomOptions.preferred, ...availableRoomOptions.others].length}
            onChange={handleInputChange}
            placeholder={[...availableRoomOptions.preferred, ...availableRoomOptions.others].length === 0 ? 'No rooms are available' : 'Select your room'}
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
                py: 1,
                bgcolor: 'white',
                borderBottomLeftRadius: 15,
                borderBottomRightRadius: 15,
              }}
            >
              <StyledTextField
                value={formData.title || ''}
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

      <Box
        sx={{
          mt: 2,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          mb: 3,
          mx: 2,
          zIndex: 100,
        }}
      >
        <LoadingButton
          onClick={onBookClick}
          fullWidth
          loading={bookClickLoading}
          variant="contained"
          disabled={roomLoading || !formData.room ? true : false}
          disableElevation
          loadingPosition="start"
          startIcon={<></>}
          sx={[
            (theme) => ({
              py: 2,
              alignItems: 'baseline',
              backgroundColor: theme.palette.common.white,
              borderRadius: 15,
              color: theme.palette.common.black,
              textTransform: 'none',
            }),
          ]}
        >
          <Typography variant="h6" fontWeight={700}>
            Book now
          </Typography>
        </LoadingButton>
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
