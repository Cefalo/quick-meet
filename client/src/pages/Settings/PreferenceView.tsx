import { DropdownOption } from '@/components/Dropdown';
import Dropdown from '@/components/Dropdown';
import StyledTextField from '@/components/StyledTextField';
import { usePreferences } from '@/context/PreferencesContext';
import { useThemeMode, type ThemePreference } from '@/context/ThemeModeContext';
import { createDropdownOptions, isChromeExt, populateDurationOptions, populateRoomCapacity, renderError } from '@/helpers/utility';
import { Box, Button, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import SettingsBrightnessRoundedIcon from '@mui/icons-material/SettingsBrightnessRounded';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import EventSeatRoundedIcon from '@mui/icons-material/EventSeatRounded';
import HourglassBottomRoundedIcon from '@mui/icons-material/HourglassBottomRounded';
import StairsIcon from '@mui/icons-material/Stairs';
import TitleIcon from '@mui/icons-material/Title';
import { useApi } from '@/context/ApiContext';

export default function PreferenceView() {
  // Form state
  const [formData, setFormData] = useState({
    floor: '',
    duration: '30',
    seats: 1,
    title: '',
  });

  // Dropdown options state
  const [floorOptions, setFloorOptions] = useState<DropdownOption[]>([]);
  const [durationOptions, setDurationOptions] = useState<DropdownOption[]>([]);
  const [roomCapacityOptions, setRoomCapacityOptions] = useState<DropdownOption[]>([]);

  // Utilities and services
  const api = useApi();
  const navigate = useNavigate();

  // Context or global state
  const { preferences, setPreferences } = usePreferences();
  const { preference: themePreference, setPreference: setThemePreference } = useThemeMode();

  // Derived data
  const durations = populateDurationOptions();

  useEffect(() => {
    const init = (floors: string[], capacities: string[]) => {
      const floorOptions = createDropdownOptions(floors);
      floorOptions.unshift({ text: 'No preference', value: '' });

      setFloorOptions(floorOptions);
      setRoomCapacityOptions(createDropdownOptions(capacities));
      setDurationOptions(createDropdownOptions(durations, 'time'));

      const { floor, duration, title, seats } = preferences;
      setFormData({
        floor: floor || '',
        title: title || '',
        duration: String(duration) || durations[0],
        seats: seats || 1,
      });
    };

    const loadInitialData = async () => {
      try {
        let floors = [];
        let res = await api.getFloors();
        const { data, status } = res || {};

        if (status !== 'success' || !data) {
          renderError(res, navigate);
          return;
        }

        floors = data;

        res = await api.getMaxSeatCount();
        const capacities = populateRoomCapacity(res?.data || 0);

        init(floors, capacities);
      } catch (error: any) {
        renderError(error, navigate);
      }
    };

    loadInitialData();
  }, []);

  const handleInputChange = (id: string, value: string | number) => {
    setFormData((prevData) => ({
      ...prevData,
      [id]: value,
    }));
  };

  const onSaveClick = async () => {
    setPreferences({
      seats: formData.seats,
      floor: formData.floor,
      title: formData.title,
      duration: Number(formData.duration),
    });

    toast.success('Saved successfully!');
  };

  return (
    <Box
      mx={2}
      mt={1}
      sx={(theme) => ({
        background: isChromeExt ? 'rgba(255, 255, 255, 0.4)' : theme.palette.background.default,
        borderRadius: 2,
      })}
    >
      <Box
        sx={{
          px: 1,
          py: 1,
        }}
      >
        <Box
          sx={{
            bgcolor: 'background.paper',
            borderTopLeftRadius: 10,
            borderTopRightRadius: 10,
            borderBottomLeftRadius: 10,
            borderBottomRightRadius: 10,
            textAlign: 'left',
          }}
        >
          {/* Appearance / Theme */}
          <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Appearance
            </Typography>
            <ToggleButtonGroup
              value={themePreference}
              exclusive
              onChange={(_e, value: ThemePreference | null) => value != null && setThemePreference(value)}
              aria-label="theme mode"
              size="small"
              sx={{
                '& .MuiToggleButtonGroup-grouped': { border: 1, borderColor: 'divider' },
              }}
            >
              <ToggleButton value="light" aria-label="light">
                <LightModeRoundedIcon sx={{ mr: 0.5 }} /> Light
              </ToggleButton>
              <ToggleButton value="dark" aria-label="dark">
                <DarkModeRoundedIcon sx={{ mr: 0.5 }} /> Dark
              </ToggleButton>
              <ToggleButton value="system" aria-label="system">
                <SettingsBrightnessRoundedIcon sx={{ mr: 0.5 }} /> System
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Dropdown
            sx={{ borderTopLeftRadius: 10, borderTopRightRadius: 10, height: '60px' }}
            id="floor"
            value={formData.floor}
            placeholder={'Select preferred floor'}
            options={floorOptions}
            onChange={handleInputChange}
            icon={
              <StairsIcon
                sx={[
                  (theme) => ({
                    color: theme.palette.grey[50],
                  }),
                ]}
              />
            }
          />

          <Dropdown
            sx={{ height: '60px' }}
            id="duration"
            value={formData.duration}
            options={durationOptions}
            onChange={handleInputChange}
            placeholder={'Select preferred meeting duration'}
            icon={
              <HourglassBottomRoundedIcon
                sx={[
                  (theme) => ({
                    color: theme.palette.grey[50],
                  }),
                ]}
              />
            }
          />

          <Dropdown
            sx={{ height: '60px', borderBottomLeftRadius: 15, borderBottomRightRadius: 15 }}
            id="seats"
            placeholder={'Select preferred room capacity'}
            value={formData.seats + ''}
            options={roomCapacityOptions}
            onChange={handleInputChange}
            icon={
              <EventSeatRoundedIcon
                sx={[
                  (theme) => ({
                    color: theme.palette.grey[50],
                  }),
                ]}
              />
            }
          />

          <StyledTextField
            value={formData.title}
            startIcon={
              <TitleIcon
                sx={[
                  (theme) => ({
                    color: theme.palette.grey[50],
                  }),
                ]}
              />
            }
            id="title"
            placeholder="Add preferred title"
            onChange={handleInputChange}
          />
        </Box>
      </Box>

      <Box
        sx={{
          mx: 2,
          mb: 3,
          textAlign: 'center',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        }}
      >
        <Button
          onClick={onSaveClick}
          fullWidth
          variant="contained"
          disableElevation
          sx={(theme) => ({
            py: 2,
            backgroundColor: theme.palette.background.paper,
            borderRadius: 15,
            textTransform: 'none',
            color: theme.palette.text.primary,
          })}
        >
          <Typography variant="h6" fontWeight={700}>
            Save
          </Typography>
        </Button>
      </Box>
    </Box>
  );
}
