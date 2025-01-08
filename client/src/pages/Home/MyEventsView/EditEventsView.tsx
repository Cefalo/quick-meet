import { AppBar, Box, Button, Checkbox, IconButton, Skeleton, Stack, Typography } from '@mui/material';
import Dropdown, { DropdownOption } from '@components/Dropdown';
import { useEffect, useRef, useState } from 'react';
import ArrowBackIosRoundedIcon from '@mui/icons-material/ArrowBackIosRounded';
import {
  chromeBackground,
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
import HourglassBottomRoundedIcon from '@mui/icons-material/HourglassBottomRounded';
import { LoadingButton } from '@mui/lab';
import AccessTimeFilledRoundedIcon from '@mui/icons-material/AccessTimeFilledRounded';
import EventSeatRoundedIcon from '@mui/icons-material/EventSeatRounded';
import RoomsDropdown, { RoomsDropdownOption } from '@components/RoomsDropdown';
import MeetingRoomRoundedIcon from '@mui/icons-material/MeetingRoomRounded';
import TitleIcon from '@mui/icons-material/Title';
import { FormData } from '@helpers/types';
import { EventResponse, IConferenceRoom } from '@quickmeet/shared';
import { useNavigate } from 'react-router-dom';
import { usePreferences } from '@/context/PreferencesContext';
import ChipInput from '@/components/ChipInput';
import StyledTextField from '@/components/StyledTextField';
import { useApi } from '@/context/ApiContext';

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
  const [availableRoomOptions, setAvailableRoomOptions] = useState<RoomsDropdownOption[]>([]);

  // Loading and advanced options state
  const [roomLoading, setRoomLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form data state
  const [formData, setFormData] = useState<FormData>(initFormData(event));

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
  }, [formData.startTime, formData.duration, formData.seats, roomCapacityOptions]);

  const handleInputChange = (id: string, value: string | number | string[] | boolean) => {
    console.log(formData);

    setFormData((prevData) => ({
      ...prevData,
      [id]: value,
    }));
  };

  async function setAvailableRooms() {
    const { startTime, duration, seats } = formData;
    const { floor } = preferences;
    const date = new Date(Date.now()).toISOString().split('T')[0];
    const formattedStartTime = convertToRFC3339(date, startTime);

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

    const data = res.data as IConferenceRoom[];
    let roomOptions: RoomsDropdownOption[] = [];

    if (!data || data.length === 0) {
      setAvailableRoomOptions(roomOptions);
      return;
    }

    if (currentRoom) {
      const filteredRooms = data.filter((item) => item.email !== currentRoom.email);
      roomOptions = createRoomDropdownOptions(filteredRooms);

      const isCurrentRoomAvailable = data.some((room) => room.email === currentRoom.email);
      const currentRoomOption = createRoomDropdownOptions([currentRoom])[0];

      if (!isCurrentRoomAvailable) {
        currentRoomOption.isBusy = true;
      }

      roomOptions.unshift(currentRoomOption);
    } else {
      roomOptions = createRoomDropdownOptions(data);
      setFormData((prev) => {
        return {
          ...prev,
          room: roomOptions[0].value,
        };
      });
    }

    setAvailableRoomOptions(roomOptions);
  }

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
    onEditConfirmed(formData);
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
              value={formData.room || (availableRoomOptions.length > 0 ? availableRoomOptions[0].value : '')}
              loading={roomLoading}
              currentRoom={currentRoom}
              disabled={!availableRoomOptions.length}
              onChange={handleInputChange}
              placeholder={availableRoomOptions.length === 0 ? 'No rooms are available' : 'Select your room'}
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
    </Box>
  );
}
