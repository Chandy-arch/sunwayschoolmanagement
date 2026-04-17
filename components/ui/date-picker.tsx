"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const MONTHS = [
  { short: "Jan", full: "January" },
  { short: "Feb", full: "February" },
  { short: "Mar", full: "March" },
  { short: "Apr", full: "April" },
  { short: "May", full: "May" },
  { short: "Jun", full: "June" },
  { short: "Jul", full: "July" },
  { short: "Aug", full: "August" },
  { short: "Sep", full: "September" },
  { short: "Oct", full: "October" },
  { short: "Nov", full: "November" },
  { short: "Dec", full: "December" },
];

function getDaysInMonth(month: number, year: number): number {
  // month is 1-based
  return new Date(year, month, 0).getDate();
}

export interface DatePickerProps {
  value?: string; // YYYY-MM-DD
  onChange?: (e: { target: { value: string; name?: string } }) => void;
  onBlur?: () => void;
  name?: string;
  disabled?: boolean;
  /** Earliest selectable year (default: current year - 100) */
  minYear?: number;
  /** Latest selectable year (default: current year) */
  maxYear?: number;
  className?: string;
}

const selectCls =
  "min-w-0 px-2 py-2 border border-gray-300 rounded-xl text-sm bg-white " +
  "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent " +
  "disabled:cursor-not-allowed disabled:opacity-50 transition-all text-gray-700 " +
  "appearance-none cursor-pointer text-center";

export function DatePicker({
  value,
  onChange,
  onBlur,
  name,
  disabled,
  minYear,
  maxYear,
  className,
}: DatePickerProps) {
  const thisYear = new Date().getFullYear();
  const minY = minYear ?? thisYear - 100;
  const maxY = maxYear ?? thisYear;

  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  // Parse incoming YYYY-MM-DD string
  useEffect(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split("-");
      setYear(y);
      setMonth(String(parseInt(m)));
      setDay(String(parseInt(d)));
    } else if (!value) {
      setYear("");
      setMonth("");
      setDay("");
    }
  }, [value]);

  const emit = (d: string, m: string, y: string) => {
    if (d && m && y) {
      const mm = m.padStart(2, "0");
      const dd = d.padStart(2, "0");
      onChange?.({ target: { value: `${y}-${mm}-${dd}`, name } });
    }
  };

  const daysAvailable =
    month && year ? getDaysInMonth(parseInt(month), parseInt(year)) : 31;

  // If current day exceeds days in new month, clamp it
  const clampedDay =
    day && parseInt(day) > daysAvailable ? String(daysAvailable) : day;

  const years = Array.from({ length: maxY - minY + 1 }, (_, i) => maxY - i);

  return (
    <div className={cn("grid gap-2", className)} style={{ gridTemplateColumns: "3fr 4fr 4fr" }}>
      {/* Day */}
      <select
        value={clampedDay}
        onChange={(e) => {
          setDay(e.target.value);
          emit(e.target.value, month, year);
        }}
        onBlur={onBlur}
        disabled={disabled}
        className={cn(selectCls)}
      >
        <option value="">Day</option>
        {Array.from({ length: daysAvailable }, (_, i) => i + 1).map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>

      {/* Month */}
      <select
        value={month}
        onChange={(e) => {
          setMonth(e.target.value);
          emit(clampedDay, e.target.value, year);
        }}
        onBlur={onBlur}
        disabled={disabled}
        className={cn(selectCls)}
      >
        <option value="">Month</option>
        {MONTHS.map((m, i) => (
          <option key={i} value={i + 1}>
            {m.full}
          </option>
        ))}
      </select>

      {/* Year */}
      <select
        value={year}
        onChange={(e) => {
          setYear(e.target.value);
          emit(clampedDay, month, e.target.value);
        }}
        onBlur={onBlur}
        disabled={disabled}
        className={cn(selectCls)}
      >
        <option value="">Year</option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}
