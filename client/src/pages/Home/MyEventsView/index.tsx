import { useApi } from '@/context/ApiContext';
import { usePreferences } from '@/context/PreferencesContext';
import DeleteConfirmationView from '@components/DeleteConfirmationView';
import EventCard from '@components/EventCard';
import { ROUTES } from '@config/routes';
import { FormData } from '@helpers/types';
import { convertToRFC3339, getTimeZoneString, renderError } from '@helpers/utility';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import { Box, Divider, Skeleton, Stack, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';
import { BookRoomDto, EventResponse, IConferenceRoom } from '@quickmeet/shared';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import EditEventsView from './EditEventsView';
export default function MyEventsView() {
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

  useEffect(() => {
    const query = {
      startTime: new Date().toISOString(),
      endTime: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(),
      timeZone: getTimeZoneString(),
    };

    api.getRooms(query.startTime, query.endTime, query.timeZone).then((res) => {
      const { data, status } = res;
      setLoading(false);

      if (status !== 'success') {
        renderError(res, navigate);
      }

      if (!data?.length) {
        return;
      }

      setEvents(data);
    });
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

    const { startTime, duration, seats, conference, attendees, title, room, eventId } = data;

    if (!room) {
      return;
    }

    const date = new Date(Date.now()).toISOString().split('T')[0];
    const formattedStartTime = convertToRFC3339(date, startTime);
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

    setEvents((prevEvents) => prevEvents.map((event) => (event.eventId === data.eventId ? res.data : event)));
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

  const uniqueDates = React.useMemo(() => {
    return Array.from(new Set(events.map((event) => event.start?.slice(0, 10)))).sort();
  }, [events]);
  const [activeStep, setActiveStep] = React.useState(0);
  const theme = useTheme();
  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };
  const filteredEvents = React.useMemo(() => {
    return events.filter((event) => event.start?.slice(0, 10) === uniqueDates[activeStep]);
  }, [events, uniqueDates, activeStep]);

  console.log('Unique Dates:', uniqueDates);
  console.log('Active Step:', activeStep);
  console.log('Filtered Events:', filteredEvents);

  if (loading) {
    return (
      <Box mx={3}>
        <Stack spacing={2} mt={3}>
          <Skeleton animation="wave" variant="rounded" height={80} />
          <Skeleton animation="wave" variant="rounded" height={80} />
        </Stack>
      </Box>
    );
  }

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
      {/* Date Navigator */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2,
        }}
      >
        {/* Back Button */}
        <Button
          size="small"
          onClick={handleBack}
          disabled={activeStep === 0}
          disableElevation
          variant="text"
          sx={{
            boxShadow: 'none',
            '&:hover, &:focus, &:active': {
              backgroundColor: 'transparent',
              boxShadow: 'none',
              color: theme.palette.primary.main,
            },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',

            padding: 0,
            minWidth: 'auto',
            color: theme.palette.primary.main,
          }}
        >
          {theme.direction === 'rtl' ? <KeyboardArrowRight sx={{ fontSize: '2.5rem' }} /> : <KeyboardArrowLeft sx={{ fontSize: '2.5rem' }} />}
        </Button>
        <Typography
          variant="h7"
          align="center"
          sx={[
            (theme) => ({
              textAlign: 'center',
              flex: 1,
              color: theme.palette.common.black,
              fontWeight: 400,
              fontFamily: 'sans-serif',
            }),
          ]}
        >
          {uniqueDates[activeStep]
            ? new Date(uniqueDates[activeStep]).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : 'No Date Selected'}
        </Typography>

        {/* Next Button */}
        <Button
          size="small"
          onClick={handleNext}
          disabled={activeStep === uniqueDates.length - 1}
          disableElevation
          variant="text"
          sx={{
            boxShadow: 'none',
            '&:hover, &:focus, &:active': {
              backgroundColor: 'transparent',
              boxShadow: 'none',
              color: theme.palette.primary.main,
            },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            minWidth: 'auto',
            color: theme.palette.primary.main,
          }}
        >
          {theme.direction === 'rtl' ? <KeyboardArrowLeft sx={{ fontSize: '2.5rem' }} /> : <KeyboardArrowRight sx={{ fontSize: '2.5rem' }} />}
        </Button>
      </Box>
      {events.filter((event) => event.start?.slice(0, 10) === uniqueDates[activeStep]).length === 0 ? (
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
          {filteredEvents.map((event, i) => (
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
    </Box>
  );
}
