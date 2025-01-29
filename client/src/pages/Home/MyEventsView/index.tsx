import { useLocales } from '@/config/i18n';
import { useApi } from '@/context/ApiContext';
import { usePreferences } from '@/context/PreferencesContext';

import DateNavigator from '@/pages/Home/MyEventsView/DateNavigator';
import DeleteConfirmationView from '@components/DeleteConfirmationView';
import EventCard from '@components/EventCard';
import { ROUTES } from '@config/routes';
import { FormData } from '@helpers/types';
import { convertToRFC3339, getTimeZoneString, renderError } from '@helpers/utility';
import { Box, Divider, Skeleton, Stack, Typography } from '@mui/material';
import { BookRoomDto, EventResponse, IConferenceRoom } from '@quickmeet/shared';
import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import EditEventsView from './EditEventsView';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';

interface MyEventsViewProps {
  redirectedDate?: string;
}

export default function MyEventsView({ redirectedDate }: MyEventsViewProps) {
  const [loading, setLoading] = useState(true);
  const [editLoading, setEditLoading] = useState(false);
  const [events, setEvents] = useState<EventResponse[]>([]);
  const navigate = useNavigate();
  const [deleteEventViewOpen, setDeleteEventViewOpen] = useState(false);
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);
  const [editView, setEditView] = useState<EventResponse | null>(null);
  const [currentRoom, setCurrentRoom] = useState<IConferenceRoom | undefined>();
  const api = useApi();
  const { preferences } = usePreferences();
  const { locale } = useLocales();

  const [currentDate, setCurrentDate] = useState<dayjs.Dayjs>(dayjs(redirectedDate) || dayjs());
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      const query = {
        startTime: currentDate.startOf('day').toISOString(),
        endTime: currentDate.endOf('day').toISOString(),
        timeZone: getTimeZoneString(),
      };

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      const res = await api.getEvents(abortControllerRef.current.signal, query.startTime, query.endTime, query.timeZone);
      const { data, status } = res;
      setLoading(false);

      if (status !== 'success') {
        renderError(res, navigate);
      }

      if (!data?.length) {
        setEvents([]);
        return;
      }

      setEvents(data);
    };

    setLoading(true);
    fetchEvents();
  }, [currentDate]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleDeleteClick = (id: string) => {
    setDeleteEventId(id);
    setDeleteEventViewOpen(true);
  };

  const handleDeleteEventClose = () => {
    setDeleteEventViewOpen(false);
    setDeleteEventId(null);
  };

  const handleConfirmDelete = async () => {
    setDeleteEventViewOpen(false);
    setLoading(true);

    if (!deleteEventId) {
      toast.error(locale.error.selectEventToDelete);
      return;
    }

    const res = await api.deleteEvent(deleteEventId);

    setLoading(false);

    const { data, status } = res;

    if (status !== 'success') {
      return renderError(res, navigate);
    }

    if (data) {
      setEvents(events.filter((e) => e.eventId !== deleteEventId));
      toast.success('Deleted event!');
    }
  };

  const onEditConfirmed = async (data: FormData) => {
    if (!data || !data.eventId || !data.room) {
      toast.error(locale.error.roomNotUpdated);
      return;
    }

    setEditLoading(true);

    const { startTime, date, duration, seats, conference, attendees, title, room, eventId } = data;

    if (!room) {
      return;
    }

    if (!date) {
      toast.error('No date selected');
      return;
    }

    const eventDate = date.split('T')[0];
    const formattedStartTime = convertToRFC3339(eventDate, startTime);

    const payload: BookRoomDto = {
      startTime: formattedStartTime,
      duration: Number(duration),
      timeZone: getTimeZoneString(),
      seats: Number(seats),
      createConference: conference,
      title: title || preferences.title,
      room: room,
      attendees,
    };

    const res = await api.updateEvent(eventId, payload);
    if (res?.redirect) {
      toast.error(locale.error.loginNotComplete);
      setTimeout(() => {
        navigate(ROUTES.signIn);
      }, 1000);
    }

    if (res?.status === 'error') {
      res.message && toast.error(res.message);
      setEditLoading(false);
      return;
    }

    setEvents((prevEvents) =>
      prevEvents
        .map((event) => (event.eventId === data.eventId ? res.data : event))
        .filter((event) => event.start.split('T')[0] === currentDate.toISOString().split('T')[0]),
    );

    toast.success('Room has been updated');
    setEditView(null);
    setEditLoading(false);
  };

  const handleEditClick = (eventId: string) => {
    const eventData = events.find((ev) => ev.eventId === eventId) || ({} as EventResponse);
    setEditView(eventData);
    if (eventData.roomEmail) {
      setCurrentRoom({
        email: eventData.roomEmail,
        name: eventData.room,
        seats: eventData.seats,
        floor: eventData.floor,
      });
    }
  };

  const handleEditEventViewClose = () => {
    setEditView(null);
  };

  const handleNextDate = async () => {
    setCurrentDate(currentDate.add(1, 'day'));
  };

  const handlePrevDate = async () => {
    setCurrentDate(currentDate.subtract(1, 'day'));
  };

  if (deleteEventViewOpen) {
    const event = events.find((e) => e.eventId === deleteEventId);
    return (
      <DeleteConfirmationView event={event} open={deleteEventViewOpen} handlePositiveClick={handleConfirmDelete} handleNegativeClick={handleDeleteEventClose} />
    );
  }

  if (editView) {
    return (
      <EditEventsView
        open={!!editView}
        handleClose={handleEditEventViewClose}
        event={editView}
        editLoading={editLoading}
        currentRoom={currentRoom}
        onEditConfirmed={onEditConfirmed}
      />
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        overflow: 'hidden',
        justifyContent: 'center',
        flexDirection: 'column',
        px: 2,
      }}
    >
      <Box>
        {/* Date Navigator */}
        <DateNavigator onPrevClick={handlePrevDate} onNextClick={handleNextDate}>
          <DatePicker
            format="MMMM DD, YYYY"
            onChange={(newDate) => {
              if (newDate) {
                setCurrentDate(newDate);
              }
            }}
            value={currentDate}
            slotProps={{
              inputAdornment: {
                position: 'start',
                sx: {
                  input: {
                    cursor: 'pointer',
                  },
                },
              },
              field: {
                readOnly: true,
              },
            }}
            sx={{
              '.MuiOutlinedInput-root': {
                '& fieldset': {
                  border: 'none',
                },
              },
              '.MuiInputBase-input': {
                color: (theme) => theme.palette.common.black,
                fontFamily: 'inherit',
                fontSize: '1.1rem',
                fontWeight: 400,
                cursor: 'default',
                p: 0,
              },
              '.MuiSvgIcon-root': {
                color: (theme) => theme.palette.grey[50],
              },
              '.MuiButtonBase-root': { cursor: 'pointer' },
            }}
          />
        </DateNavigator>
      </Box>

      {loading ? (
        <Box mx={3}>
          <Stack spacing={2} mt={3}>
            <Skeleton animation="wave" variant="rounded" height={80} />
            <Skeleton animation="wave" variant="rounded" height={80} />
          </Stack>
        </Box>
      ) : (
        <>
          {events.length == 0 ? (
            <Typography mt={3} variant="h6">
              No events to show
            </Typography>
          ) : (
            <Box
              sx={{
                borderBottomLeftRadius: 10,
                borderBottomRightRadius: 10,
                borderTopLeftRadius: 10,
                borderTopRightRadius: 10,
                pb: 1,
                px: 1.5,
                mx: 2,
                mt: 1,
                bgcolor: 'white',
                zIndex: 100,
              }}
            >
              {events.map((event, i) => (
                <React.Fragment key={i}>
                  <EventCard
                    key={i}
                    sx={{
                      pt: 2,
                      pb: 3,
                    }}
                    event={event}
                    handleEditClick={handleEditClick}
                    disabled={loading}
                    onDelete={() => event.eventId && handleDeleteClick(event.eventId)}
                    hideMenu={!event.isEditable}
                  />
                  {i !== events.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
