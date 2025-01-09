import { Box, Button, Typography } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useState } from 'react';
import { ROUTES } from '@/config/routes';
import { useNavigate } from 'react-router-dom';
import { useApi } from '@/context/ApiContext';

interface LogoutViewProps {
  handleCancel: () => void;
}

export default function LogoutView({ handleCancel }: LogoutViewProps) {
  const [loading, setLoading] = useState(false);
  const api = useApi();
  const navigate = useNavigate();

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
            Are you sure you want to logout?
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
            This will revoke the application permissions and would require to approve them again when trying to log back in
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
            Confirm
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
            Cancel
          </Typography>
        </Button>
      </Box>
    </Box>
  );
}
