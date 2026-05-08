import { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, Clock, Search, MapPin } from 'lucide-react';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { openCityModal } from '../store/slices/citySlice';
import { toast } from 'sonner';

// ── Constants ───────────────────────────────────────────────────────────────

const MIN_TIME = '08:00'; // 8 AM
const MAX_TIME = '22:00'; // 10 PM
const RETURN_DEFAULT_TIME = '08:00'; // returns default to 8 AM next day

// 30-min slots between 8:00 AM and 10:00 PM, inclusive (29 slots)
const TIME_SLOTS: string[] = (() => {
  const out: string[] = [];
  for (let h = 8; h <= 22; h++) {
    out.push(`${String(h).padStart(2, '0')}:00`);
    if (h < 22) out.push(`${String(h).padStart(2, '0')}:30`);
  }
  return out;
})();

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

  if (pickupTime < MIN_TIME) {
    pickupTime = MIN_TIME;
  }

  if (pickupTime > MAX_TIME) {
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
        className="w-full flex items-center gap-3 text-left text-base font-semibold text-gray-900 cursor-pointer outline-none"
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
              (minTime !== undefined && slot < minTime) ||
              (maxTime !== undefined && slot > maxTime);
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
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                  disabled
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
    return c < MIN_TIME ? MIN_TIME : c;
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
    if (pickupDate === returnDate && returnTime <= pickupTime) {
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

  const iconClass = 'w-5 h-5 text-gray-700 shrink-0';

  const valueClass = 'text-base font-semibold text-gray-900 truncate';

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
            bg-gradient-to-r from-teal-500 to-cyan-600
            text-white font-semibold tracking-wide
            shadow-[0_10px_30px_rgba(20,184,166,0.35)]
            transition-all duration-300
            hover:-translate-y-[2px]
            hover:shadow-[0_18px_40px_rgba(20,184,166,0.45)]
            hover:from-teal-600 hover:to-cyan-700
            active:scale-[0.98]
            focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-300/60
            disabled:opacity-50 disabled:cursor-not-allowed
            disabled:hover:translate-y-0 disabled:hover:shadow-[0_10px_30px_rgba(20,184,166,0.35)]
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
