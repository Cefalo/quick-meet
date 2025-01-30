import { Box, IconButton, styled, SxProps, Theme, ToggleButton, ToggleButtonGroup } from '@mui/material';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { useLocales } from '@/config/i18n';

const TopBar = styled(Box)(({ theme }) => ({
  paddingTop: theme.spacing(1.5),
  paddingBottom: theme.spacing(1.5),
  paddingRight: theme.spacing(2),
  paddingLeft: theme.spacing(2),
  display: 'flex',
  width: '100%',
  justifyContent: 'center',
  alignItems: 'center',
  textAlign: 'center',
}));

const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme: _ }) => ({
  borderRadius: 30,
  '& .MuiToggleButtonGroup-grouped': {
    border: 'none',
    '&:not(:first-of-type)': {
      borderRadius: 30,
    },
    '&:first-of-type': {
      borderRadius: 30,
    },
  },
}));

const StyledToggleButton = styled(ToggleButton)(({ theme }) => ({
  borderRadius: 30,
  border: 'none',
  textTransform: 'none',
  padding: '15px',
  fontWeight: 600,
  color: theme.palette.text.disabled,
  '&:hover': {
    backgroundColor: 'inherit',
  },
  '&.Mui-selected': {
    border: 'none',
    boxShadow: 'inset 0px 2px 5px rgba(0, 0, 0, 0.1)',
    backgroundColor: '#F2F2F2',
    fontWeight: 600,
    color: theme.palette.text.primary,
  },
}));

interface TopNavigationBarProps {
  handleTabChange: (tabIndex: number) => void;
  tabIndex: number;
  sx?: SxProps<Theme>;
}

const TopNavigationBar = ({ sx, tabIndex, handleTabChange }: TopNavigationBarProps) => {
  const navigate = useNavigate();
  const { locale } = useLocales();

  const handleChange = (_: React.SyntheticEvent | null, newValue: number) => {
    if (newValue !== null) {
      handleTabChange(newValue);
    }
  };

  const onSettingClick = () => {
    navigate(ROUTES.settings);
  };

  return (
    <TopBar
      sx={{
        ...sx,
      }}
    >
      <Box
        sx={{
          bgcolor: 'white',
          py: 0.5,
          px: 0.5,
          width: '100%',
          borderRadius: 30,
        }}
      >
        <StyledToggleButtonGroup value={tabIndex} exclusive onChange={handleChange} aria-label="event tabs" fullWidth={true}>
          <StyledToggleButton value={0} aria-label="new event" fullWidth={true}>
            {locale.buttonText.newEvent}
          </StyledToggleButton>
          <StyledToggleButton value={1} aria-label="my events" fullWidth={true}>
            {locale.buttonText.myEvents}
          </StyledToggleButton>
        </StyledToggleButtonGroup>
      </Box>

      <Box
        sx={{
          borderRadius: 100,
          py: 1,
          px: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          mr: 2,
        }}
      >
        <IconButton aria-label="settings" onClick={onSettingClick}>
          <SettingsRoundedIcon />
        </IconButton>
      </Box>
    </TopBar>
  );
};
export default TopNavigationBar;
