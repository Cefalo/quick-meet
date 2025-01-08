import { Box, Button, Typography } from '@mui/material';
import { GoogleIcon } from '@components/CustomIcons';
import { useLocation } from 'react-router-dom';
import { secrets } from '@config/secrets';
import toast from 'react-hot-toast';
import { isChromeExt } from '@helpers/utility';
import { useApi } from '@/context/ApiContext';

const Login = () => {
  const api = useApi();
  const { state } = useLocation();
  const errorMessage = state?.message;

  if (errorMessage) {
    toast.error(errorMessage);
  }

  async function onSignInClick(): Promise<void> {
    await api.login();
  }

  return (
    <Box
      mx={2}
      mt={1}
      sx={{
        flexGrow: 1,
        position: 'relative',
      }}
    >
      <Box mt={18} display={'flex'} flexDirection={'column'} zIndex={100}>
        <Typography variant="h2" sx={[(theme) => ({ color: theme.palette.text.primary, width: '100%' })]}>
          {secrets.appTitle}
        </Typography>
        <Typography variant="h5" sx={[(theme) => ({ color: theme.palette.text.secondary, fontWeight: 400, mt: 1 })]}>
          {secrets.appSlogan}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 4 }}>
        <Box sx={{ px: isChromeExt ? 3 : 10 }}>
          <Button
            type="submit"
            sx={[
              (theme) => ({
                height: 70,
                backgroundColor: theme.palette.common.white,
                color: theme.palette.common.black,
                fontSize: theme.typography.h6,
                fontWeight: 700,
                borderRadius: 20,
                zIndex: 101,
                '& .MuiButton-startIcon': {
                  marginRight: theme.spacing(3),
                  marginTop: theme.spacing(-0.55), // Adjusted margin
                },
              }),
            ]}
            fullWidth
            variant="contained"
            startIcon={<GoogleIcon />}
            onClick={onSignInClick}
          >
            Sign in
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
