import Api from '@/api/api';
import { ROUTES } from '@config/routes';
import { secrets } from '@config/secrets';
import { ApiResponse } from '@quickmeet/shared';
import dayjs, { Dayjs } from 'dayjs';
import { toast } from 'react-hot-toast';
import { NavigateFunction } from 'react-router-dom';

/**
 * Returns an array of time strings formatted as HH:mm in 12 hrs format with 15mins interval
 * ie: 10:00AM, 10:15AM, ....
 * @param start time in utc format
 */
export function populateTimeOptions(start?: string) {
  const timeOptions = [];
  const now = start ? new Date(new Date(start).setHours(0, 0, 0, 0)) : new Date(new Date().setHours(0, 0, 0, 0));
  let currentHours = now.getHours();
  let currentMinutes = Math.floor(now.getMinutes() / 15) * 15;

  if (currentMinutes === 60) {
    currentMinutes = 0;
    currentHours += 1;
  }

  const currentTimeInMinutes = toMinutesSinceMidnight(currentHours, currentMinutes);

  for (let i = 0; i < 24 * 4; i++) {
    const hours = Math.floor(i / 4);
    const minutes = (i % 4) * 15;
    const formattedTime = formatTime(hours, minutes);
    const optionTimeInMinutes = toMinutesSinceMidnight(hours, minutes);

    if (optionTimeInMinutes >= currentTimeInMinutes) {
      timeOptions.push(formattedTime);
    }
  }

  return timeOptions;
}

/**
 * Returns an array of duration strings formatted in mins with 15mins interval
 * ie: 30, 45, etc
 * @param start time in utc format
 */
export function populateDurationOptions(start: number = 30, end: number = 3 * 60) {
  let mins = start;
  const options = [];

  while (mins < end) {
    options.push(mins.toString());
    mins += 15;
  }

  return options;
}

export function populateRoomCapacity(max: number) {
  const options = [];
  let capacity = 1;

  while (capacity <= max) {
    options.push(capacity.toString());
    capacity += 1;
  }

  return options;
}

export function toMinutesSinceMidnight(hours: number, minutes: number) {
  return hours * 60 + minutes;
}

export function formatTime(hours: number, minutes: number) {
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // If hour is 0, it should be 12
  const _minutes = minutes < 10 ? '0' + minutes : minutes;
  return hours + ':' + _minutes + ' ' + ampm;
}

// returns timeZone formatted as "Asia/Dhaka", etc
export function getTimeZoneString() {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return timeZone;
}

export function getTimezoneOffset() {
  const offsetInMinutes = new Date().getTimezoneOffset();
  const sign = offsetInMinutes <= 0 ? '+' : '-';
  const offsetInHours = Math.floor(Math.abs(offsetInMinutes) / 60);
  const offsetInRemainingMinutes = Math.abs(offsetInMinutes) % 60;
  const formattedOffset = `${sign}${String(offsetInHours).padStart(2, '0')}:${String(offsetInRemainingMinutes).padStart(2, '0')}`;

  return formattedOffset;
}

export function convertToRFC3339(dateString: string, timeString: string) {
  const timeZoneOffset = getTimezoneOffset();
  
  // Validate inputs
  if (!dateString || !timeString) {
    console.error('Invalid date or time string:', { dateString, timeString });
    return '';
  }
  
  // Parse the date and time components
  const dateParts = dateString.split('-');
  const timeParts = timeString.split(':');
  
  if (dateParts.length !== 3 || timeParts.length < 2) {
    console.error('Invalid date or time format:', { dateString, timeString });
    return '';
  }
  
  const year = parseInt(dateParts[0]);
  const month = parseInt(dateParts[1]);
  const day = parseInt(dateParts[2]);
  const hours = parseInt(timeParts[0]);
  const minutes = parseInt(timeParts[1]);
  
  // Validate parsed values
  if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hours) || isNaN(minutes)) {
    console.error('Invalid date or time values:', { year, month, day, hours, minutes });
    return '';
  }
  
  // Create date in local timezone (month is 0-indexed in Date constructor)
  const date = new Date(year, month - 1, day, hours, minutes, 0);
  
  // Get ISO string components
  const year_str = date.getFullYear();
  const month_str = String(date.getMonth() + 1).padStart(2, '0');
  const day_str = String(date.getDate()).padStart(2, '0');
  const hours_str = String(date.getHours()).padStart(2, '0');
  const minutes_str = String(date.getMinutes()).padStart(2, '0');
  const seconds_str = String(date.getSeconds()).padStart(2, '0');

  // Return the formatted date and time in RFC 3339 format with timezone
  return `${year_str}-${month_str}-${day_str}T${hours_str}:${minutes_str}:${seconds_str}${timeZoneOffset}`;
}

export function convertToLocaleTime(dateStr?: string) {
  if (!dateStr) return '-';

  const date = new Date(dateStr);

  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };

  return date.toLocaleTimeString('en-US', options);
}

export function convertToLocaleDate(dateStr?: string) {
  if (!dateStr) return '-';

  const date = new Date(dateStr);

  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  };

  return date.toLocaleDateString('en-US', options);
}

export const createDropdownOptions = (options: string[], type: 'time' | 'default' = 'default') => {
  return (options || []).map((option) => ({ value: option, text: type === 'time' ? formatMinsToHM(Number(option), 'm') : option }));
};

export const renderError = async (err: ApiResponse<any>, navigate: NavigateFunction) => {
  const { status, statusCode, message, redirect } = err;
  if (status === 'error') {
    if (statusCode === 401) {
      try {
        await new Api().logout();
      } catch (error) { }
      navigate(ROUTES.signIn);
    } else if (statusCode === 400) {
      toast.error('Input missing fields');
    } else if (redirect) {
      navigate(ROUTES.signIn);
    } else {
      message && toast.error(message);
    }
  }
};

export const formatMinsToHM = (value: number, decorator?: string) => {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;

  let result = '';
  if (hours > 0) {
    result += `${hours} hr${hours > 1 ? 's' : ''} `;
  }
  if (minutes > 0 || hours === 0) {
    result += `${minutes}${decorator ? decorator : ''}`;
  }
  return result.trim();
};

export const isEmailValid = (email: string) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    );
};

export const chromeBackground = {
  backgroundImage: 'url(/background.png)', // Reference your image from the public folder
  backgroundSize: 'cover', // Ensures the image covers the entire card
  backgroundPosition: 'center', // Centers the image
  backgroundRepeat: 'no-repeat', // Prevents the image from repeating
};

const params = new URLSearchParams(window.location.search);

export const isChromeExt = Boolean(params.get('chrome')) || secrets.appEnvironment === 'chrome';

export const isPastDate = (date: string | Dayjs | undefined): boolean => {
  if (!date || !dayjs(date).isValid()) {
    return false;
  }

  const selectedDate = dayjs(date).startOf('day');
  const today = dayjs().startOf('day');

  return selectedDate.isBefore(today);
};
