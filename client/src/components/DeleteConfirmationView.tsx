import Button from '@mui/material/Button';
import AppBar from '@mui/material/AppBar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { Box, SxProps, Theme } from '@mui/material';
import ArrowBackIosRoundedIcon from '@mui/icons-material/ArrowBackIosRounded';
import { EventResponse } from '@quickmeet/shared';
import { chromeBackground, isChromeExt } from '@helpers/utility';
import EventCard from './EventCard';

interface DeleteConfirmationViewProps {
  handleNegativeClick: () => void;
  handlePositiveClick: () => void;
  open: boolean;
  event?: EventResponse;
}

export default function DeleteConfirmationView({ event, open, handleNegativeClick, handlePositiveClick }: DeleteConfirmationViewProps) {
  if (!open) return <></>;

  const background: SxProps<Theme> = isChromeExt ? { ...chromeBackground } : { background: '#F8F8F8' };
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        height: '100%',
        zIndex: 10,
        width: '100%',
        boxShadow: 'none',
        overflow: 'hidden',
        ...background,
      }}
    >
      <AppBar
        sx={{ bgcolor: 'transparent', position: 'relative', display: 'flex', flexDirection: 'row', py: 2, alignItems: 'center', px: 3, boxShadow: 'none' }}
      >
        <IconButton edge="start" color="inherit" onClick={handleNegativeClick} aria-label="close">
          <ArrowBackIosRoundedIcon
            fontSize="small"
            sx={[
              (theme) => ({
                color: theme.palette.common.black,
              }),
            ]}
          />
        </IconButton>
      </AppBar>
      <Box
        sx={{
          mx: 3,
          alignItems: 'center',
          textAlign: 'center',
          pb: 1,
          my: 1,
          mt: 5,
        }}
      >
        <Typography variant="h4" fontWeight={700}>
          Are you sure you want to permanently delete this event?
        </Typography>
        {event && (
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              textAlign: 'center',
              justifyContent: 'center',
              mt: 2,
              mx: 1,
              py: 2,
              backgroundColor: 'white',
              borderRadius: 2,
            }}
          >
            <EventCard event={event} hideMenu={true} />
          </Box>
        )}

        <Box
          sx={{
            mx: 2,
            mt: 4,
            mb: 3,
            textAlign: 'center',
          }}
        >
          <Button
            onClick={handlePositiveClick}
            fullWidth
            variant="contained"
            disableElevation
            sx={[
              (theme) => ({
                py: 2,
                backgroundColor: theme.palette.common.white,
                borderRadius: 15,
                color: theme.palette.common.black,
              }),
            ]}
          >
            <Typography
              variant="h6"
              fontWeight={700}
              color="error"
              sx={{
                textTransform: 'none',
              }}
            >
              Delete
            </Typography>
          </Button>

          <Button
            onClick={handleNegativeClick}
            variant="text"
            disableElevation
            sx={[
              (_) => ({
                py: 1,
                px: 3,
                mt: 2,
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
                textTransform: 'none',
              }),
            ]}
          >
            <Typography variant="subtitle2" fontWeight={700}>
              Cancel
            </Typography>
          </Button>
        </Box>
      </Box>
      <Box flexGrow={1} />
    </Box>
  );
}
