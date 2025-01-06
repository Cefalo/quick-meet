import { Box, Checkbox, Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Dropdown, { DropdownOption } from '@components/Dropdown';
import LoadingButton from '@mui/lab/LoadingButton';
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
import toast from 'react-hot-toast';
import AccessTimeFilledRoundedIcon from '@mui/icons-material/AccessTimeFilledRounded';
import EventSeatRoundedIcon from '@mui/icons-material/EventSeatRounded';
import { FormData } from '@helpers/types';
import { BookRoomDto, EventResponse, IConferenceRoom } from '@quickmeet/shared';
import MeetingRoomRoundedIcon from '@mui/icons-material/MeetingRoomRounded';
import Api from '@api/api';
import HourglassBottomRoundedIcon from '@mui/icons-material/HourglassBottomRounded';
import RoomsDropdown, { RoomsDropdownOption } from '@components/RoomsDropdown';
import { usePreferences } from '@/context/PreferencesContext';
import StyledTextField from '@/components/StyledTextField';
import ChipInput from '@/components/ChipInput';
import TitleIcon from '@mui/icons-material/Title';

const createRoomDropdownOptions = (rooms: IConferenceRoom[]) => {
  return (rooms || []).map((room) => ({ value: room.email, text: room.name, seats: room.seats, floor: room.floor }) as RoomsDropdownOption);
};

interface BookRoomViewProps {
  onRoomBooked: () => void;
}

export default function BookRoomView({ onRoomBooked }: BookRoomViewProps) {
  // Context or global state
  const { preferences } = usePreferences();

  // loading states
  const [loading, setLoading] = useState(false);
  const [roomLoading, setRoomLoading] = useState(false);
  const [initialPageLoad, setInitialPageLoad] = useState(false);

  // dropdown options
  const [timeOptions, setTimeOptions] = useState<DropdownOption[]>([]);
  const [durationOptions, setDurationOptions] = useState<DropdownOption[]>([]);
  const [roomCapacityOptions, setRoomCapacityOptions] = useState<DropdownOption[]>([]);
  const [availableRoomOptions, setAvailableRoomOptions] = useState<RoomsDropdownOption[]>([]);

  // form data
  const [formData, setFormData] = useState<FormData>({
    startTime: '',
    duration: Number(preferences.duration),
    seats: preferences.seats,
  });

  // Utilities and hooks
  const navigate = useNavigate();
  const api = new Api();
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    initializeDropdowns();
    setInitialPageLoad(true);

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
  }, [initialPageLoad, formData.startTime, formData.duration, formData.seats]);

  const handleInputChange = (id: string, value: string | number | string[] | boolean) => {
    setFormData((prevData) => ({
      ...prevData,
      [id]: value,
    }));
  };

  async function initializeDropdowns() {
    const res = await api.getMaxSeatCount();

    const capacities = populateRoomCapacity(res?.data || 0);
    const durations = populateDurationOptions();
    const timeOptions = populateTimeOptions();

    setTimeOptions(createDropdownOptions(timeOptions));
    setDurationOptions(createDropdownOptions(durations, 'time'));
    setRoomCapacityOptions(createDropdownOptions(capacities));

    const { duration, seats } = preferences;

    setFormData((p) => ({
      ...p,
      startTime: timeOptions[0],
      seats: seats || Number(capacities[0]),
      duration: duration || Number(durations[0]),
    }));

    setInitialPageLoad(true);
  }

  async function setAvailableRooms() {
    const { startTime, duration, seats } = formData;
    const { floor } = preferences;

    console.log('room fetch', startTime, duration, seats, floor);

    const date = new Date(Date.now()).toISOString().split('T')[0];
    const formattedStartTime = convertToRFC3339(date, startTime);

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

    const data = res.data as IConferenceRoom[];
    let roomEmail: string | undefined;
    let roomOptions: RoomsDropdownOption[] = [];

    if (data.length > 0) {
      roomEmail = data[0].email;
      roomOptions = createRoomDropdownOptions(data);
    }

    setFormData({
      ...formData,
      room: roomEmail,
    });

    setAvailableRoomOptions(roomOptions);
  }

  async function onBookClick() {
    setLoading(true);
    const { startTime, duration, seats, conference, attendees, title, room } = formData;

    if (!room) {
      return;
    }

    const date = new Date(Date.now()).toISOString().split('T')[0];
    const formattedStartTime = convertToRFC3339(date, startTime);
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
      attendees,
    };

    const res = await api.createEvent(payload);
    const { data, status } = res;
    setLoading(false);

    if (status !== 'success') {
      await setAvailableRooms();
      return renderError(res, navigate);
    }

    const { room: roomName } = data as EventResponse;

    toast.success(`${roomName} has been booked!`);

    setAvailableRoomOptions([]);
    onRoomBooked();
  }

  return (
    <Box mx={2} mt={1} display={'flex'}>
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
            px: 1,
            pt: 1,
          }}
        >
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
            value={formData.room || (availableRoomOptions.length > 0 ? availableRoomOptions[0].value : '')}
            loading={roomLoading}
            disabled={!availableRoomOptions.length}
            onChange={handleInputChange}
            placeholder={availableRoomOptions.length === 0 ? 'No rooms are available' : 'Select your room'}
            sx={{
              borderBottomLeftRadius: 15,
              borderBottomRightRadius: 15,
            }}
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
          <Box
            sx={{
              py: 1,
            }}
          >
            <Box
              sx={{
                pt: 1,
                bgcolor: 'white',
                borderTopLeftRadius: 10,
                borderTopRightRadius: 10,
                borderBottomLeftRadius: 15,
                borderBottomRightRadius: 15,
              }}
            >
              <StyledTextField
                value={formData.title}
                placeholder="Quick Meeting"
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

              <ChipInput sx={{ mt: 1, mx: 0.5 }} id="attendees" onChange={handleInputChange} value={formData.attendees} type="email" />
            </Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                my: 1,
                mt: 2,
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
          loading={loading}
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
    </Box>
  );
}
