// src/components/CustomDatePicker.jsx
import React from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

const CustomDatePicker = ({
  label = "Select Date",
  value,              
  onChange,           
  disabled = false,
  className = "",
}) => {
  return (
    <DatePicker
      label={label}
      value={value ? dayjs(value) : null}
      onChange={(newValue) => {
        // Convert dayjs object → string or null
        const formatted = newValue && newValue.isValid()
          ? newValue.format('YYYY-MM-DD')
          : null;
        onChange(formatted);
      }}
      disabled={disabled}
      slotProps={{
        textField: {
          fullWidth: true,
          variant: "outlined",
          size: "medium",
          className: `bg-white dark:bg-gray-800 ${className}`,
          // Optional: add helper text or error state here
        },
        popper: {
          className: "z-50", // Ensures it appears above modals/etc.
        },
      }}
      format="DD/MM/YYYY" // Display format (you can change to MM/DD/YYYY if preferred)
    />
  );
};

export default CustomDatePicker;