import BugReportRoundedIcon from '@mui/icons-material/BugReportRounded';
import { secrets } from '@config/secrets';
import LightbulbRoundedIcon from '@mui/icons-material/LightbulbRounded';
import { constants } from '@/config/constants';
import { Box, Button, styled } from '@mui/material';

const SettingsButton = styled(Button)(({ theme: _ }) => ({
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
}));

export default function SupportView() {
  const onReportBugClick = () => {
    const url = constants.bugReportUrl;
    if (secrets.appEnvironment === 'chrome') {
      chrome.tabs.create({
        url: url,
        active: true,
      });
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const onRequestFeatureClick = () => {
    const url = constants.featureRequestUrl;
    if (secrets.appEnvironment === 'chrome') {
      chrome.tabs.create({
        url: url,
        active: true,
      });
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
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
          py: 1,
        }}
      >
        <Box
          sx={{
            bgcolor: 'white',
            borderTopLeftRadius: 10,
            borderTopRightRadius: 10,
            borderBottomLeftRadius: 10,
            borderBottomRightRadius: 10,
            textAlign: 'left',
          }}
        >
          <SettingsButton
            sx={{
              py: 2.5,
              justifyContent: 'flex-start',
              px: 3,
            }}
            fullWidth
            onClick={onReportBugClick}
            startIcon={<BugReportRoundedIcon sx={{ mr: 1 }} />}
          >
            Report a bug
          </SettingsButton>

          <SettingsButton
            sx={{
              py: 2.5,
              justifyContent: 'flex-start',
              px: 3,
            }}
            fullWidth
            onClick={onRequestFeatureClick}
            startIcon={<LightbulbRoundedIcon sx={{ mr: 1 }} />}
          >
            Request a feature
          </SettingsButton>
        </Box>
      </Box>
    </Box>
  );
}
