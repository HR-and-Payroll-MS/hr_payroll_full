// src/components/CustomTimePicker.jsx
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat'; // ← IMPORTANT
dayjs.extend(customParseFormat); // ← Enable parsing custom formats

const CustomTimePicker = ({ value, onChange, className = "" }) => {
  // Handle both full ISO ("2025-12-21T20:00:00Z") AND simple "HH:mm" strings
  const parseValue = () => {
    if (!value) return null;

    // If it's already a full ISO or valid date, use it
    if (dayjs(value).isValid()) {
      return dayjs(value);
    }

    // If it's just "HH:mm" (like "20:00"), parse it with format
    if (typeof value === 'string' && /^\d{2}:\d{2}$/.test(value.trim())) {
      return dayjs(value.trim(), 'HH:mm');
    }

    return null;
  };

  const parsedValue = parseValue();

  return (
    <TimePicker
      value={parsedValue}
      onChange={(newValue) => {
        if (!newValue || !newValue.isValid()) {
          onChange(null);
          return;
        }

        const timeString = newValue.format('HH:mm'); // "20:00"

        // If original value was full ISO, merge properly
        // Otherwise, just return the time string
        if (value && dayjs(value).isValid() && value.includes('T')) {
          const fullIso = mergeTimeIntoISO(value, timeString);
          onChange(fullIso);
        } else {
          // Just return "HH:mm" string (matches your current data format)
          onChange(timeString);
        }
      }}
      ampm={true}
      slotProps={{
        textField: {
          fullWidth: true,
          variant: "outlined",
          size: "small",
          className: `w-full ${className}`,
        },
      }}
    />
  );
};

export default CustomTimePicker;