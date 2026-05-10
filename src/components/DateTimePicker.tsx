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
const RETURN_DEFAULT_TIME = '23:30'; // returns default to 11:30 PM

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

const computeDefaults = () => {
  const now = new Date();
  const candidate = roundUpTo30Min(new Date(now.getTime() + 60 * 60 * 1000));

  const pickupDateObj = new Date(now);
  pickupDateObj.setHours(0, 0, 0, 0);

  let pickupTime = hm(candidate);

  if (compareTime(pickupTime, MIN_TIME) < 0) {
    pickupTime = MIN_TIME;
  }

  // If calculated time is past midnight (next day territory), move to next day
  if (compareTime(pickupTime, MAX_TIME) > 0) {
    pickupDateObj.setDate(pickupDateObj.getDate() + 1);
    pickupTime = MIN_TIME;
  }

  const returnDateObj = new Date(pickupDateObj);
  returnDateObj.setDate(returnDateObj.getDate() + 1);

  return {
    pickupDate: ymd(pickupDateObj),
    pickupTime,
    returnDate: ymd(returnDateObj),
    returnTime: RETURN_DEFAULT_TIME,
  };
};

// Helper to get smart pickup time for a given date
const getSmartPickupTime = (selectedDate: string): string => {
  const today = ymd(new Date());
  if (selectedDate === today) {
    // Today: current time + 1 hour, rounded to 30 mins
    const now = new Date();
    const candidate = roundUpTo30Min(new Date(now.getTime() + 60 * 60 * 1000));
    let time = hm(candidate);
    if (compareTime(time, MIN_TIME) < 0) time = MIN_TIME;
    if (compareTime(time, MAX_TIME) > 0) time = MIN_TIME; // Past midnight, fallback
    return time;
  }
  // Future date: default to 6 AM
  return MIN_TIME;
};

// ── TimeSelect — custom dropdown with icon trigger ──────────────────────────

interface TimeSelectProps {
  value: string;
  onChange: (time: string) => void;
  minTime?: string;
  maxTime?: string;
  ariaLabel?: string;
  icon?: React.ReactNode;
}

const TimeSelect: React.FC<TimeSelectProps> = ({
  value,
  onChange,
  minTime,
  maxTime,
  ariaLabel,
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

  return (
    <div ref={wrapperRef} className="relative w-full">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className="w-full flex items-center gap-3 text-left text-base font-bold text-primary-600 cursor-pointer outline-none"
      >
        <span className="flex-1 truncate">{value ? formatTime12(value) : '--:--'}</span>
        {icon}
      </button>

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

  const minPickupTimeForToday = useMemo(() => {
    const now = new Date();
    const c = hm(roundUpTo30Min(new Date(now.getTime() + 60 * 60 * 1000)));
    return compareTime(c, MIN_TIME) < 0 ? MIN_TIME : c;
  }, []);

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
    setPickupDate(value);
    // Auto-set pickup time based on selected date
    setPickupTime(getSmartPickupTime(value));
    setTimeout(() => openPicker(returnDateRef), 100);
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

  // ── Style helpers ──────────────────────────────────────────────────────

  // Shared cell layout — single row of [icon] [value], no upper labels
  const cellClass =
    'flex-1 flex items-center gap-3 px-6 py-6 cursor-pointer transition-colors duration-200 hover:bg-gray-50';

  const iconClass = 'w-5 h-5 text-primary-600 shrink-0';

  const valueClass = 'text-base font-bold text-primary-600 truncate';

  // sr-only style for the hidden native date input — keeps it accessible &
  // showPicker()-callable while removing it from the visual flow.
  const visuallyHiddenInputClass =
    'absolute h-px w-px overflow-hidden whitespace-nowrap p-0 -m-px border-0';

  return (
    <div>
      <div
        className="
          bg-white
          shadow-[0_20px_60px_rgba(0,0,0,0.12)]
          rounded-2xl
          overflow-visible
          flex flex-col md:flex-row md:items-stretch
        "
      >
        {/* Field group — divide-x lives here only, so no divider hits the button */}
        <div
          className="
            flex flex-col md:flex-row md:items-stretch md:flex-1
            divide-y md:divide-y-0 md:divide-x divide-gray-200
          "
        >
          {/* Location */}
          <button
            type="button"
            onClick={() => dispatch(openCityModal())}
            className={`${cellClass} md:rounded-l-2xl text-left`}
          >
            <span className={`${valueClass} flex-1`}>
              {selectedCity?.name || 'Select city'}
            </span>
            <MapPin className={iconClass} />
          </button>

          {/* Pickup Date */}
          <div className={cellClass} onClick={() => openPicker(pickupDateRef)}>
            <span className={`${valueClass} flex-1`}>{formatDateDDMMYYYY(pickupDate)}</span>
            <Calendar className={iconClass} />
            <input
              ref={pickupDateRef}
              id="pickup-date"
              type="date"
              value={pickupDate}
              onChange={(e) => handlePickupDateChange(e.target.value)}
              min={today}
              aria-label="Pickup date"
              className={visuallyHiddenInputClass}
            />
          </div>

          {/* Pickup Time */}
          <div className={cellClass} onClick={(e) => e.stopPropagation()}>
            <TimeSelect
              icon={<Clock className={iconClass} />}
              value={pickupTime}
              onChange={setPickupTime}
              minTime={pickupMinTime}
              maxTime={MAX_TIME}
              ariaLabel="Pickup time"
            />
          </div>

          {/* Return Date */}
          <div className={cellClass} onClick={() => openPicker(returnDateRef)}>
            <span className={`${valueClass} flex-1`}>{formatDateDDMMYYYY(returnDate)}</span>
            <Calendar className={iconClass} />
            <input
              ref={returnDateRef}
              id="return-date"
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              min={pickupDate || today}
              aria-label="Return date"
              className={visuallyHiddenInputClass}
            />
          </div>

          {/* Return Time */}
          <div className={cellClass} onClick={(e) => e.stopPropagation()}>
            <TimeSelect
              icon={<Clock className={iconClass} />}
              value={returnTime}
              onChange={setReturnTime}
              minTime={returnMinTime}
              maxTime={MAX_TIME}
              ariaLabel="Return time"
            />
          </div>
        </div>

        {/* CTA — sibling of field group, no divide-x applies */}
        <Button
          onClick={handleSearch}
          disabled={!isFormComplete}
          className="
            group relative overflow-hidden
            w-full md:w-auto md:self-stretch
            px-8 py-5 md:px-12 md:py-0 md:h-auto
            text-base
            rounded-2xl md:rounded-l-none md:rounded-r-2xl
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
