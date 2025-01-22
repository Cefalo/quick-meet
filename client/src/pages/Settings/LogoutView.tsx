import { Box, Button, Typography } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useState } from 'react';
import { ROUTES } from '@/config/routes';
import { useNavigate } from 'react-router-dom';
import { useApi } from '@/context/ApiContext';
import { useLocales } from '@/config/i18n';

interface LogoutViewProps {
  handleCancel: () => void;
}

export default function LogoutView({ handleCancel }: LogoutViewProps) {
  const [loading, setLoading] = useState(false);
  const api = useApi();
  const navigate = useNavigate();
  const { locale } = useLocales();

  const onConfirmClick = async () => {
    setLoading(true);

    await api.logout(true);
    navigate(ROUTES.signIn);
  };

  return (
    <Box
      mx={2}
      mt={1}
      sx={{
        borderRadius: 2,
      }}
    >
      <Box
        sx={{
          px: 1,
        }}
      >
        <Box
          sx={{
            borderTopLeftRadius: 10,
            borderTopRightRadius: 10,
            borderBottomLeftRadius: 10,
            borderBottomRightRadius: 10,
            textAlign: 'left',
            px: 2,
            py: 4,
          }}
        >
          <Typography
            sx={[
              (theme) => ({
                textAlign: 'center',
                flex: 1,
                color: theme.palette.common.black,
                fontWeight: 700,
              }),
            ]}
            variant="h3"
            component={'div'}
          >
            {locale.info.logoutConfirmation}
          </Typography>
          <Typography
            sx={[
              (theme) => ({
                textAlign: 'center',
                flex: 1,
                color: theme.palette.common.black,
                mt: 3,
                fontSize: 17,
              }),
            ]}
            variant="body1"
            component={'div'}
          >
            {locale.info.logoutConfirmation}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          mx: 4,
          mb: 3,
          textAlign: 'center',
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        <LoadingButton
          onClick={onConfirmClick}
          fullWidth
          variant="contained"
          disableElevation
          loading={loading}
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
            {locale.buttonText.confirm}
          </Typography>
        </LoadingButton>

        <Button
          variant="text"
          onClick={handleCancel}
          sx={{
            py: 2,
            mt: 2,
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
            {locale.buttonText.cancel}
          </Typography>
        </Button>
      </Box>
    </Box>
  );
}
