import { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, Clock, Search, MapPin } from 'lucide-react';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { openCityModal } from '../store/slices/citySlice';
import { toast } from 'sonner';

// ── Constants ───────────────────────────────────────────────────────────────

const MIN_TIME = '06:00'; // 6 AM
const MAX_TIME = '23:30'; // 11:30 PM

// 30-min slots between 6:00 AM and 11:30 PM
const TIME_SLOTS: string[] = (() => {
  const out: string[] = [];
  for (let h = 6; h <= 23; h++) {
    out.push(`${String(h).padStart(2, '0')}:00`);
    out.push(`${String(h).padStart(2, '0')}:30`);
  }
  return out;
})();

// Helper to compare times, treating '00:00' as end of day (after 23:59)
const compareTime = (a: string, b: string): number => {
  const aVal = a === '00:00' ? '24:00' : a;
  const bVal = b === '00:00' ? '24:00' : b;
  return aVal.localeCompare(bVal);
};

// ── Helpers ─────────────────────────────────────────────────────────────────

const pad = (n: number) => String(n).padStart(2, '0');

const ymd = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const hm = (d: Date): string => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

// 10:28 → 10:30, 10:30 stays 10:30
const roundUpTo30Min = (d: Date): Date => {
  const out = new Date(d);
  const remainder = out.getMinutes() % 30;
  if (remainder !== 0) out.setMinutes(out.getMinutes() + (30 - remainder));
  out.setSeconds(0, 0);
  return out;
};

// "HH:MM" 24h → "HH:MM AM/PM" 12h
const formatTime12 = (time: string): string => {
  if (!time) return '--:--';
  const [hStr, mStr] = time.split(':');
  const h = Number(hStr);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${pad(h12)}:${mStr} ${period}`;
};

// "YYYY-MM-DD" → "DD/MM/YYYY"
const formatDateDDMMYYYY = (value: string): string => {
  if (!value) return 'dd/mm/yyyy';
  const [y, m, d] = value.split('-');
  return `${d}/${m}/${y}`;
};

/**
 * True when a date change looks like month navigation inside the native calendar rather
 * than the user clicking a day.
 *
 * Chrome's date picker rewrites the input's value (firing `change`) every time you step
 * a month, so a month step and a real selection are indistinguishable from the event
 * alone. The day-of-month is what separates them: stepping carries it over unchanged,
 * clamping only when the target month is shorter (31 Jan → 28 Feb). Picking a day
 * changes it, and picking within the same month is never a step.
 */
const isMonthStep = (from: string, to: string): boolean => {
  if (!from || !to) return false;

  const [fromYear, fromMonth, fromDay] = from.split('-').map(Number);
  const [toYear, toMonth, toDay] = to.split('-').map(Number);
  if ([fromYear, fromMonth, fromDay, toYear, toMonth, toDay].some(Number.isNaN)) return false;

  // Same month → the user clicked a day, never a step.
  if (fromYear === toYear && fromMonth === toMonth) return false;

  // Day carried over → stepped.
  if (fromDay === toDay) return true;

  // Day clamped to a shorter month → still a step, not a pick.
  const lastDayOfTargetMonth = new Date(toYear, toMonth, 0).getDate();
  return toDay === lastDayOfTargetMonth && fromDay > lastDayOfTargetMonth;
};

const computeDefaults = () => {
  const now = new Date();
  const candidate = roundUpTo30Min(new Date(now.getTime() + 60 * 60 * 1000));

  const today = ymd(now);
  const candidateDate = ymd(candidate);

  const pickupDateObj = new Date(now);
  pickupDateObj.setHours(0, 0, 0, 0);

  let pickupTime = hm(candidate);

  // If adding 1 hour crossed to the next day, use tomorrow
  if (candidateDate !== today) {
    pickupDateObj.setDate(pickupDateObj.getDate() + 1);
    pickupTime = MIN_TIME;
  }
  // If calculated time is before business hours, use min time
  else if (compareTime(pickupTime, MIN_TIME) < 0) {
    pickupTime = MIN_TIME;
  }
  // If calculated time is past business hours, move to next day
  else if (compareTime(pickupTime, MAX_TIME) > 0) {
    pickupDateObj.setDate(pickupDateObj.getDate() + 1);
    pickupTime = MIN_TIME;
  }

  const returnDateObj = new Date(pickupDateObj);
  returnDateObj.setDate(returnDateObj.getDate() + 1);

  return {
    pickupDate: ymd(pickupDateObj),
    pickupTime,
    returnDate: ymd(returnDateObj),
    // Default to a 24-hour cycle: same time as pickup, next day
    returnTime: pickupTime,
  };
};

// Helper to get smart pickup time for a given date
const getSmartPickupTime = (selectedDate: string): string => {
  const now = new Date();
  const today = ymd(now);
  
  if (selectedDate === today) {
    // Today: current time + 1 hour, rounded to 30 mins
    const candidate = roundUpTo30Min(new Date(now.getTime() + 60 * 60 * 1000));
    const candidateDate = ymd(candidate);
    
    // If +1 hour crosses to next day, today is not bookable - return null indicator
    if (candidateDate !== today) {
      return ''; // Empty means today is not bookable
    }
    
    let time = hm(candidate);
    if (compareTime(time, MIN_TIME) < 0) time = MIN_TIME;
    if (compareTime(time, MAX_TIME) > 0) return ''; // Past business hours
    return time;
  }
  // Future date: default to 6 AM
  return MIN_TIME;
};

// ── Shared cell styles ──────────────────────────────────────────────────────

// Shared cell layout — a field label stacked above the [value] [icon] row.
// py-4 (not py-6) keeps the bar close to its original height now that the
// label adds a line.
const cellClass =
  'flex-1 flex flex-col justify-center gap-1 px-4 lg:px-6 py-4 cursor-pointer transition-colors duration-200 hover:bg-gray-50';

// Inner row holding the value and its trailing icon.
const cellRowClass = 'flex items-center gap-3';

// Matches the date-field label styling used on VehicleListingPage.
const labelClass = 'text-xs font-medium text-gray-500 text-left';

const iconClass = 'w-5 h-5 text-primary-600 shrink-0';

const valueClass = 'text-base font-bold text-primary-600 truncate';

// Transparent control stretched across an entire cell. Every field uses this so
// a click anywhere in the cell — padding and label included — activates it, not
// just the value text. For the date fields it also means the tap lands on the
// real input, so iOS Safari opens its native picker reliably (showPicker()
// alone is a no-op on a hidden input in iOS).
const cellOverlayClass =
  'absolute inset-0 w-full h-full opacity-0 cursor-pointer appearance-none m-0 p-0 border-0 bg-transparent';

// ── TimeSelect — a full cell: label, value, and a full-cell dropdown trigger ─

interface TimeSelectProps {
  value: string;
  onChange: (time: string) => void;
  minTime?: string;
  maxTime?: string;
  // Visible field label. Rendered here rather than by the caller so the trigger
  // overlay can cover it — the whole cell has to be one click target.
  label: string;
  // The trigger is named by the label *and* the current value ("Start Time,
  // 06:00 AM"); a bare aria-label cannot do that — it would suppress the value.
  labelId: string;
  icon?: React.ReactNode;
}

const TimeSelect: React.FC<TimeSelectProps> = ({
  value,
  onChange,
  minTime,
  maxTime,
  label,
  labelId,
  icon,
}) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open && activeRef.current) {
      activeRef.current.scrollIntoView({ block: 'nearest' });
    }
  }, [open]);

  const valueId = `${labelId}-value`;

  return (
    <div ref={wrapperRef} className={`${cellClass} relative`}>
      <span id={labelId} className={labelClass}>
        {label}
      </span>
      <span className={cellRowClass}>
        <span id={valueId} className={`${valueClass} flex-1`}>
          {value ? formatTime12(value) : '--:--'}
        </span>
        {icon}
      </span>

      {/* Trigger stretched over the whole cell, so clicking the label, the
          padding, or the value all open the dropdown — matching the date
          fields, whose transparent input covers their cell the same way. */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${labelId} ${valueId}`}
        className={cellOverlayClass}
      />

      {open && (
        <div
          role="listbox"
          className="absolute top-full left-0 mt-2 w-36 max-h-60 overflow-y-auto bg-white rounded-xl shadow-xl border border-gray-200 z-50 py-1"
        >
          {TIME_SLOTS.map((slot) => {
            const disabled =
              (minTime !== undefined && compareTime(slot, minTime) < 0) ||
              (maxTime !== undefined && compareTime(slot, maxTime) > 0);
            const selected = slot === value;
            return (
              <button
                key={slot}
                ref={selected ? activeRef : undefined}
                role="option"
                aria-selected={selected}
                type="button"
                disabled={disabled}
                onClick={() => {
                  onChange(slot);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${disabled
                  ? 'text-gray-300 cursor-not-allowed'
                  : selected
                    ? 'bg-primary-50 font-semibold text-primary-700'
                    : 'text-gray-700 hover:bg-gray-50'
                  }`}
              >
                {formatTime12(slot)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────

export default function DateTimePicker() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const selectedCity = useAppSelector((state) => state.city.selectedCity);

  const initial = useMemo(() => computeDefaults(), []);
  const [pickupDate, setPickupDate] = useState(initial.pickupDate);
  const [pickupTime, setPickupTime] = useState(initial.pickupTime);
  const [returnDate, setReturnDate] = useState(initial.returnDate);
  const [returnTime, setReturnTime] = useState(initial.returnTime);

  const pickupDateRef = useRef<HTMLInputElement>(null);
  const returnDateRef = useRef<HTMLInputElement>(null);

  const today = ymd(new Date());

  // Check if today is still bookable (current time + 1hr is within business hours today)
  const isTodayBookable = useMemo(() => {
    const now = new Date();
    const candidate = new Date(now.getTime() + 60 * 60 * 1000);
    const candidateDate = ymd(candidate);
    if (candidateDate !== today) return false; // Crossed to next day
    const candidateTime = hm(roundUpTo30Min(candidate));
    return compareTime(candidateTime, MAX_TIME) <= 0;
  }, [today]);

  const minBookableDate = isTodayBookable ? today : ymd(new Date(Date.now() + 24 * 60 * 60 * 1000));

  const minPickupTimeForToday = useMemo(() => {
    if (!isTodayBookable) return MIN_TIME; // Won't be used if today not bookable
    const now = new Date();
    const candidate = roundUpTo30Min(new Date(now.getTime() + 60 * 60 * 1000));
    const c = hm(candidate);
    return compareTime(c, MIN_TIME) < 0 ? MIN_TIME : c;
  }, [isTodayBookable]);

  const pickupMinTime = pickupDate === today ? minPickupTimeForToday : MIN_TIME;
  const returnMinTime =
    returnDate && pickupDate === returnDate && pickupTime
      ? (() => {
        const idx = TIME_SLOTS.indexOf(pickupTime);
        return idx >= 0 && idx < TIME_SLOTS.length - 1
          ? TIME_SLOTS[idx + 1]
          : pickupTime;
      })()
      : MIN_TIME;

  // Same-day: keep return > pickup
  useEffect(() => {
    if (pickupDate === returnDate && compareTime(returnTime, pickupTime) <= 0) {
      const idx = TIME_SLOTS.indexOf(pickupTime);
      const next = idx >= 0 && idx < TIME_SLOTS.length - 1 ? TIME_SLOTS[idx + 1] : '';
      if (next) setReturnTime(next);
    }
  }, [pickupDate, returnDate, pickupTime, returnTime]);

  // Push return forward if pickup advances past it
  useEffect(() => {
    if (returnDate && pickupDate && returnDate < pickupDate) {
      const d = new Date(pickupDate);
      d.setDate(d.getDate() + 1);
      setReturnDate(ymd(d));
    }
  }, [pickupDate, returnDate]);

  const openPicker = (ref: React.RefObject<HTMLInputElement | null>) => {
    const el = ref.current;
    if (!el) return;
    try {
      el.showPicker?.();
    } catch {
      el.focus();
    }
  };

  const handlePickupDateChange = (value: string) => {
    if (!value) return;

    // Distinguish "user stepped to another month" from "user picked a day" — both fire
    // this identical change event, because Chrome rewrites the input's value as you
    // navigate the native calendar.
    const steppedMonth = isMonthStep(pickupDate, value);

    // Check if selected date is bookable
    const smartTime = getSmartPickupTime(value);

    if (!smartTime) {
      // Today is not bookable (too late), push to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = ymd(tomorrow);
      setPickupDate(tomorrowStr);
      setPickupTime(MIN_TIME);
      toast.info('Too late to book for today, showing tomorrow');
    } else {
      setPickupDate(value);
      setPickupTime(smartTime);
    }

    // Hand off to the return-date picker only once a real day has been chosen.
    // Stepping months inside the native calendar fires this same change event, and
    // opening another picker would dismiss the one the user is still navigating —
    // only one native picker can be open at a time.
    if (!steppedMonth) {
      setTimeout(() => openPicker(returnDateRef), 100);
    }
  };

  const isFormComplete = !!(
    selectedCity &&
    pickupDate &&
    pickupTime &&
    returnDate &&
    returnTime
  );

  const handleSearch = () => {
    const pickup = new Date(`${pickupDate}T${pickupTime}`);
    const ret = new Date(`${returnDate}T${returnTime}`);
    if (ret <= pickup) {
      toast.error(
        pickupDate === returnDate
          ? 'Return time must be after pickup time'
          : 'Return must be after pickup',
      );
      return;
    }

    const params = new URLSearchParams({
      startDate: pickupDate,
      startTime: pickupTime,
      endDate: returnDate,
      endTime: returnTime,
    });
    navigate(`/vehicles?${params.toString()}`);
  };

  return (
    <div>
      <div
        className="
          bg-white
          shadow-[0_20px_60px_rgba(0,0,0,0.12)]
          rounded-2xl
          overflow-visible
          flex flex-col lg:flex-row lg:items-stretch
        "
      >
        {/* Field group — divide-x lives here only, so no divider hits the button */}
        <div
          className="
            flex flex-col lg:flex-row lg:items-stretch lg:flex-1
            divide-y lg:divide-y-0 lg:divide-x divide-gray-200
          "
        >
          {/* Location */}
          <button
            type="button"
            onClick={() => dispatch(openCityModal())}
            className={`${cellClass} lg:rounded-l-2xl text-left`}
          >
            <span className={labelClass}>City</span>
            <span className={cellRowClass}>
              <span className={`${valueClass} flex-1`}>
                {selectedCity?.name || 'Select city'}
              </span>
              <MapPin className={iconClass} />
            </span>
          </button>

          {/* Start Date */}
          <div className={`${cellClass} relative`} onClick={() => openPicker(pickupDateRef)}>
            <label htmlFor="pickup-date" className={labelClass}>
              Start Date
            </label>
            <span className={cellRowClass}>
              <span className={`${valueClass} flex-1`}>{formatDateDDMMYYYY(pickupDate)}</span>
              <Calendar className={iconClass} />
            </span>
            <input
              ref={pickupDateRef}
              id="pickup-date"
              type="date"
              value={pickupDate}
              onChange={(e) => handlePickupDateChange(e.target.value)}
              onClick={() => openPicker(pickupDateRef)}
              min={minBookableDate}
              className={cellOverlayClass}
            />
          </div>

          {/* Start Time */}
          <TimeSelect
            label="Start Time"
            labelId="start-time-label"
            icon={<Clock className={iconClass} />}
            value={pickupTime}
            onChange={setPickupTime}
            minTime={pickupMinTime}
            maxTime={MAX_TIME}
          />

          {/* End Date */}
          <div className={`${cellClass} relative`} onClick={() => openPicker(returnDateRef)}>
            <label htmlFor="return-date" className={labelClass}>
              End Date
            </label>
            <span className={cellRowClass}>
              <span className={`${valueClass} flex-1`}>{formatDateDDMMYYYY(returnDate)}</span>
              <Calendar className={iconClass} />
            </span>
            <input
              ref={returnDateRef}
              id="return-date"
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              onClick={() => openPicker(returnDateRef)}
              min={pickupDate || minBookableDate}
              className={cellOverlayClass}
            />
          </div>

          {/* End Time */}
          <TimeSelect
            label="End Time"
            labelId="end-time-label"
            icon={<Clock className={iconClass} />}
            value={returnTime}
            onChange={setReturnTime}
            minTime={returnMinTime}
            maxTime={MAX_TIME}
          />
        </div>

        {/* CTA — sibling of field group, no divide-x applies */}
        <Button
          onClick={handleSearch}
          disabled={!isFormComplete}
          className="
            group relative overflow-hidden
            w-full lg:w-auto lg:self-stretch
            px-8 py-5 lg:px-12 lg:py-0 lg:h-auto
            text-base
            rounded-2xl lg:rounded-l-none lg:rounded-r-2xl
            bg-gradient-to-r from-primary-500 to-primary-600
            text-white font-bold tracking-wide
            shadow-[0_10px_30px_rgba(1,124,238,0.35)]
            transition-all duration-300
            hover:-translate-y-[2px]
            hover:shadow-[0_18px_40px_rgba(1,124,238,0.45)]
            hover:from-primary-600 hover:to-primary-700
            active:scale-[0.98]
            focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300/60
            disabled:opacity-50 disabled:cursor-not-allowed
            disabled:hover:translate-y-0 disabled:hover:shadow-[0_10px_30px_rgba(1,124,238,0.35)]
            inline-flex items-center justify-center
          "
        >
          <div className="absolute inset-0 bg-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <span className="relative z-10 flex items-center">
            <Search className="mr-2 h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
            <span className="mr-2">Ride Now</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </span>
        </Button>
      </div>
    </div>
  );
}
