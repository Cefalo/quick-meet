import { useApi } from '@/context/ApiContext';
import { usePreferences } from '@/context/PreferencesContext';
import DateNavigator from '@/pages/Home/MyEventsView/DateNavigator';
import DeleteConfirmationView from '@components/DeleteConfirmationView';
import EventCard from '@components/EventCard';
import { ROUTES } from '@config/routes';
import { FormData } from '@helpers/types';
import { Box, Divider, Skeleton, Stack, Typography } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import { BookRoomDto, EventResponse, IConferenceRoom } from '@quickmeet/shared';
import { useNavigate } from 'react-router-dom';
import { convertToRFC3339, getTimeZoneString, renderError } from '@helpers/utility';
import toast from 'react-hot-toast';
import EditEventsView from './EditEventsView';
import dayjs from 'dayjs';
import DatePickerPopper from '@/pages/Home/MyEventsView/DatePickerPopper';

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

  const [datePickerOpen, setDatePickerOpen] = useState<boolean>(false);

  const [currentDate, setCurrentDate] = useState<dayjs.Dayjs>(dayjs(redirectedDate) || dayjs());
  const [datePickerAnchorEl, setDatePickerAnchorEl] = useState<null | HTMLElement>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      const isToday = currentDate.isSame(new Date(), 'day');

      const query = {
        startTime: isToday ? new Date().toISOString() : currentDate.startOf('day').toISOString(),
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

  const handleDatePopperClick = (event: React.MouseEvent<HTMLElement>) => {
    setDatePickerAnchorEl(event.currentTarget);
    setDatePickerOpen(true);
  };

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
      toast.error('Please select the event to delete');
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
      toast.error('Room was not updated');
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
      attendees: attendees,
    };

    const res = await api.updateEvent(eventId, payload);
    if (res?.redirect) {
      toast.error("Couldn't complete request. Redirecting to login page");
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

  const handleEventResponse = async (eventId: string, response: string) => {
    if (!eventId) {
      toast.error('Room was not updated');
      return;
    }

    setEditLoading(true);

    const res = await api.updateEventResponse(eventId, response);
    if (res?.status === 'error') {
      res.message && toast.error(res.message);
      setEditLoading(false);
      return;
    }

    setEvents((prevEvents) =>
      prevEvents
        .map((event) => (event.eventId === eventId ? { ...event, ...res.data } : event))
        .filter((event) => event.start.split('T')[0] === currentDate.toISOString().split('T')[0]),
    );

    toast.success('Event response has been updated');
    setEditLoading(false);
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
        flexDirection: 'column',
        px: 2,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          mb: 1,
        }}
      >
        {/* Date Navigator */}
        <DateNavigator onPrevClick={handlePrevDate} onNextClick={handleNextDate}>
          <Typography
            sx={{
              cursor: 'pointer',
            }}
            onClick={handleDatePopperClick}
            variant="subtitle1"
          >
            {currentDate.format('ddd MMM D, YYYY')}
          </Typography>
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
                    isEditable={event.isEditable}
                    handleEventResponse={handleEventResponse}
                  />
                  {i !== events.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </Box>
          )}
        </>
      )}
      <DatePickerPopper
        currentDate={currentDate}
        setCurrentDate={setCurrentDate}
        open={datePickerOpen}
        setOpen={setDatePickerOpen}
        anchorEl={datePickerAnchorEl}
      />
    </Box>
  );
}
