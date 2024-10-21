import { BookRoomDto, EventResponse, IConferenceRoom } from '@bookify/shared';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { convertToLocaleTime, convertToRFC3339, getTimeZoneString, renderError } from '../../../helpers/utility';
import Api from '../../../api/api';
import toast from 'react-hot-toast';
import { Box, Divider, Skeleton, Stack, Typography } from '@mui/material';
import { EventCard } from '../../../components/EventCard';
import AlertDialog from '../../../components/AlertDialog';
import EditDialog from '../../../components/EventCard/EditDialog';
import { FormData } from '../../../helpers/types';
import { ROUTES } from '../../../config/routes';

export default function MyEventsView() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventResponse[]>([]);
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);
  const [editDialog, setEditDialog] = useState<EventResponse | null>(null);
  const [currentRoom, setCurrentRoom] = useState<IConferenceRoom>({});

  const api = new Api();

  useEffect(() => {
    const query = {
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
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
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setDeleteEventId(null);
  };

  const handleConfirmDelete = async () => {
    setDialogOpen(false);

    if (!deleteEventId) {
      toast.error('Please select the event to delete');
      return;
    }

    const res = await api.deleteRoom(deleteEventId);
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

    console.log('onedit', data);

    setLoading(true);

    const { startTime, duration, seats, conference, attendees, title, room, eventId } = data;

    if (!room) {
      return;
    }

    const date = new Date(Date.now()).toISOString().split('T')[0];
    const formattedStartTime = convertToRFC3339(date, startTime);

    const payload: BookRoomDto = {
      startTime: formattedStartTime,
      duration: duration,
      timeZone: getTimeZoneString(),
      seats: seats,
      createConference: conference,
      title,
      room: room,
      attendees,
    };

    const res = await new Api().updateRoom(eventId, payload);
    console.log(res);

    if (res?.redirect) {
      toast.error("Couldn't complete request. Redirecting to login page");
      setTimeout(() => {
        navigate(ROUTES.signIn);
      }, 1000);
    }

    if (res?.status === 'error') {
      res.message && toast.error(res.message);
      setLoading(false);
      setEditDialog(null);
      return;
    }

    setEvents((prevEvents) => prevEvents.map((event) => (event.eventId === data.eventId ? { ...event, ...res.data } : event)));
    toast.success('Room has been updated');
    setEditDialog(null);
    setLoading(false);
  };

  const handleEditClick = (eventId: string) => {
    const eventData = events.find((ev) => ev.eventId === eventId) || ({} as EventResponse);
    setEditDialog(eventData);
    setCurrentRoom({
      email: eventData.roomEmail,
      name: eventData.room,
      seats: eventData.seats,
      floor: eventData.floor,
    });
  };

  const handleDialogClose = () => {
    setEditDialog(null);
  };

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

  if (dialogOpen) {
    return <AlertDialog open={dialogOpen} handlePositiveClick={handleConfirmDelete} handleNegativeClick={handleCloseDialog} />;
  }

  if (editDialog) {
    return (
      <EditDialog
        open={!!editDialog}
        handleClose={handleDialogClose}
        event={editDialog}
        loading={false} // todo
        currentRoom={currentRoom}
        onEditConfirmed={onEditConfirmed}
      />
    );
  }

  return (
    <Box
      sx={{
        height: editDialog ? '200px' : 'auto',
        overflow: 'hidden',
      }}
    >
      {events.length === 0 ? (
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
          }}
        >
          {events.map((event, i) => (
            <React.Fragment key={i}>
              <EventCard
                key={i}
                event={event}
                handleEditClick={handleEditClick}
                disabled={loading}
                onDelete={() => event.eventId && handleDeleteClick(event.eventId)}
              />
              {i !== events.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </Box>
      )}
    </Box>
  );
}
