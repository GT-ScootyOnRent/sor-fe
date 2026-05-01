import { useMemo, useState } from 'react';
import { Loader2, CheckCircle2, ChevronsUpDown, Check } from 'lucide-react';
import { toast } from 'sonner';
import { City, State } from 'country-state-city';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { PhoneInput, isValidIndianMobile, toE164 } from '../components/PhoneInput';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../components/ui/command';
import { cn } from '../components/ui/utils';
import {
  useCreatePartnerInquiryMutation,
  type CreatePartnerInquiry,
  type InvestmentAmount,
} from '../store/api/partnerInquiryApi';

type IndianCity = { name: string; stateCode: string };
type IndianState = { name: string; isoCode: string };

const INDIAN_CITIES: IndianCity[] = (City.getCitiesOfCountry('IN') ?? []).map((c) => ({
  name: c.name,
  stateCode: c.stateCode,
}));

const INDIAN_STATES: IndianState[] = (State.getStatesOfCountry('IN') ?? []).map((s) => ({
  name: s.name,
  isoCode: s.isoCode,
}));

type FormState = {
  name: string;
  phoneNumber: string;
  email: string;
  state: string;
  stateCode: string;
  city: string;
  investmentAmount: InvestmentAmount | '';
  ownsVehicles: boolean;
  vehicleCount: string;
  agreePrivacy: boolean;
  agreeTerms: boolean;
};

const initialState: FormState = {
  name: '',
  phoneNumber: '',
  email: '',
  state: '',
  stateCode: '',
  city: '',
  investmentAmount: '',
  ownsVehicles: false,
  vehicleCount: '',
  agreePrivacy: false,
  agreeTerms: false,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function WorkWithUs() {
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitted, setSubmitted] = useState(false);

  const [createInquiry, { isLoading }] = useCreatePartnerInquiryMutation();

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};

    if (!form.name.trim()) next.name = 'Name is required';
    else if (form.name.trim().length > 120) next.name = 'Name must be 120 characters or fewer';

    if (!form.phoneNumber) next.phoneNumber = 'Phone number is required';
    else if (form.phoneNumber.length !== 10) next.phoneNumber = 'Enter a 10-digit mobile number';
    else if (!isValidIndianMobile(form.phoneNumber)) next.phoneNumber = 'Enter a valid Indian mobile number';

    if (!form.email.trim()) next.email = 'Email is required';
    else if (!EMAIL_RE.test(form.email.trim())) next.email = 'Enter a valid email address';

    if (!form.city.trim()) next.city = 'City is required';
    if (!form.state.trim()) next.state = 'State is required';
    if (!form.investmentAmount) next.investmentAmount = 'Select an investment amount';

    if (form.ownsVehicles) {
      const count = Number(form.vehicleCount);
      if (!form.vehicleCount.trim()) next.vehicleCount = 'Vehicle count is required';
      else if (!Number.isFinite(count) || count <= 0) next.vehicleCount = 'Enter a positive number';
    }

    if (!form.agreePrivacy) next.agreePrivacy = 'You must agree to the Privacy Policy';
    if (!form.agreeTerms) next.agreeTerms = 'You must agree to the Terms & Conditions';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const mapBackendErrors = (payload: any): Partial<Record<keyof FormState, string>> => {
    const src = payload?.errors ?? payload ?? {};
    const out: Partial<Record<keyof FormState, string>> = {};
    for (const [k, v] of Object.entries(src)) {
      const key = (k.charAt(0).toLowerCase() + k.slice(1)) as keyof FormState;
      out[key] = Array.isArray(v) ? String(v[0]) : String(v);
    }
    return out;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: CreatePartnerInquiry = {
      name: form.name.trim(),
      phoneNumber: toE164(form.phoneNumber),
      email: form.email.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      investmentAmount: form.investmentAmount as InvestmentAmount,
      ownsVehicles: form.ownsVehicles,
      vehicleCount: form.ownsVehicles ? Number(form.vehicleCount) : null,
    };

    try {
      const res = await createInquiry(payload).unwrap();
      toast.success(res.message || 'Inquiry submitted successfully');
      setForm(initialState);
      setErrors({});
      setSubmitted(true);
    } catch (err: any) {
      if (err?.status === 400 && err?.data) {
        const fieldErrors = mapBackendErrors(err.data);
        setErrors(fieldErrors);
        toast.error('Please fix the highlighted fields');
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    }
  };

  const baseInput =
    'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition';
  const errorInput = 'border-red-400';
  const okInput = 'border-gray-300';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Work With Us
            </h1>
            <p className="text-gray-600 text-base md:text-lg">
              Partner with Scootyonrent. Tell us about yourself and we'll get back to you.
            </p>
          </div>

          {submitted ? (
            <div className="bg-white rounded-xl shadow-md p-10 text-center">
              <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Thanks for reaching out!</h2>
              <p className="text-gray-600 mb-6">
                We've received your inquiry. Our team will contact you shortly.
              </p>
              <Button
                onClick={() => setSubmitted(false)}
                className="bg-primary-500 hover:bg-primary-600 text-white"
              >
                Submit another inquiry
              </Button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              noValidate
              className="bg-white rounded-xl shadow-md p-6 md:p-8 space-y-5"
            >
              {/* Name */}
              <div>
                <Label htmlFor="name" className="mb-1.5 block">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  maxLength={120}
                  className={errors.name ? errorInput : okInput}
                  disabled={isLoading}
                />
                {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
              </div>

              {/* Phone + Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label htmlFor="phoneNumber" className="mb-1.5 block">
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <PhoneInput
                    id="phoneNumber"
                    value={form.phoneNumber}
                    onChange={(v) => setField('phoneNumber', v)}
                    disabled={isLoading}
                    hasError={Boolean(errors.phoneNumber)}
                  />
                  {errors.phoneNumber && (
                    <p className="text-xs text-red-600 mt-1">{errors.phoneNumber}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email" className="mb-1.5 block">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setField('email', e.target.value)}
                    className={errors.email ? errorInput : okInput}
                    disabled={isLoading}
                  />
                  {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                </div>
              </div>

              {/* State + City (state first; city unlocks once state is picked) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label htmlFor="state" className="mb-1.5 block">
                    State <span className="text-red-500">*</span>
                  </Label>
                  <StateSelect
                    value={form.state}
                    onChange={(stateName, stateCode) => {
                      setForm((prev) => ({
                        ...prev,
                        state: stateName,
                        stateCode,
                        // Picking a different state invalidates the previously chosen city
                        city: prev.stateCode === stateCode ? prev.city : '',
                      }));
                      if (errors.state) setErrors((prev) => ({ ...prev, state: undefined }));
                    }}
                    disabled={isLoading}
                    hasError={Boolean(errors.state)}
                  />
                  {errors.state && <p className="text-xs text-red-600 mt-1">{errors.state}</p>}
                </div>

                <div>
                  <Label htmlFor="city" className="mb-1.5 block">
                    City <span className="text-red-500">*</span>
                  </Label>
                  <CitySelect
                    value={form.city}
                    stateCode={form.stateCode}
                    onChange={(cityName) => {
                      setField('city', cityName);
                    }}
                    disabled={!form.stateCode || isLoading}
                    hasError={Boolean(errors.city)}
                  />
                  {errors.city && <p className="text-xs text-red-600 mt-1">{errors.city}</p>}
                </div>
              </div>

              {/* Investment Amount */}
              <div>
                <Label htmlFor="investmentAmount" className="mb-1.5 block">
                  Investment Amount <span className="text-red-500">*</span>
                </Label>
                <select
                  id="investmentAmount"
                  value={form.investmentAmount}
                  onChange={(e) => setField('investmentAmount', e.target.value as InvestmentAmount | '')}
                  className={`${baseInput} ${errors.investmentAmount ? errorInput : okInput}`}
                  disabled={isLoading}
                >
                  <option value="">Select an option</option>
                  <option value="below_5_lakh">Below 5 Lakh</option>
                  <option value="above_5_lakh">Above 5 Lakh</option>
                </select>
                {errors.investmentAmount && (
                  <p className="text-xs text-red-600 mt-1">{errors.investmentAmount}</p>
                )}
              </div>

              {/* Owns Vehicles */}
              <div>
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.ownsVehicles}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setForm((prev) => ({
                        ...prev,
                        ownsVehicles: checked,
                        vehicleCount: checked ? prev.vehicleCount : '',
                      }));
                      if (!checked && errors.vehicleCount) {
                        setErrors((prev) => ({ ...prev, vehicleCount: undefined }));
                      }
                    }}
                    disabled={isLoading}
                    className="w-4 h-4 accent-primary-500"
                  />
                  <span className="text-sm text-gray-800">Do you own vehicles?</span>
                </label>

                {form.ownsVehicles && (
                  <div className="mt-3">
                    <Label htmlFor="vehicleCount" className="mb-1.5 block">
                      How many vehicles? <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="vehicleCount"
                      type="number"
                      min={1}
                      value={form.vehicleCount}
                      onChange={(e) => setField('vehicleCount', e.target.value)}
                      className={errors.vehicleCount ? errorInput : okInput}
                      disabled={isLoading}
                    />
                    {errors.vehicleCount && (
                      <p className="text-xs text-red-600 mt-1">{errors.vehicleCount}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Agreements */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <label className="flex items-start gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.agreePrivacy}
                    onChange={(e) => setField('agreePrivacy', e.target.checked)}
                    disabled={isLoading}
                    className="mt-1 w-4 h-4 accent-primary-500"
                  />
                  <span className="text-sm text-gray-700">
                    I agree to the{' '}
                    <a
                      href="/privacy-policy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 underline hover:text-primary-700"
                    >
                      Privacy Policy
                    </a>
                  </span>
                </label>
                {errors.agreePrivacy && (
                  <p className="text-xs text-red-600 ml-6">{errors.agreePrivacy}</p>
                )}

                <label className="flex items-start gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.agreeTerms}
                    onChange={(e) => setField('agreeTerms', e.target.checked)}
                    disabled={isLoading}
                    className="mt-1 w-4 h-4 accent-primary-500"
                  />
                  <span className="text-sm text-gray-700">
                    I agree to the{' '}
                    <a
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 underline hover:text-primary-700"
                    >
                      Terms &amp; Conditions
                    </a>
                  </span>
                </label>
                {errors.agreeTerms && (
                  <p className="text-xs text-red-600 ml-6">{errors.agreeTerms}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary-500 hover:bg-primary-600 text-white py-6"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Inquiry'
                )}
              </Button>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

// ── City Combobox ────────────────────────────────────────────────────────────

interface CitySelectProps {
  value: string;
  stateCode: string;
  onChange: (cityName: string) => void;
  disabled?: boolean;
  hasError?: boolean;
}

function CitySelect({ value, stateCode, onChange, disabled, hasError }: CitySelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const cityPool = useMemo(
    () => (stateCode ? INDIAN_CITIES.filter((c) => c.stateCode === stateCode) : []),
    [stateCode],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cityPool.slice(0, 100);
    return cityPool.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 100);
  }, [search, cityPool]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full flex items-center justify-between px-3 py-2 border rounded-lg bg-white text-left',
            'focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition',
            'disabled:opacity-60 disabled:cursor-not-allowed',
            hasError ? 'border-red-400' : 'border-gray-300',
          )}
        >
          <span className={cn('truncate', !value && 'text-gray-400')}>
            {value || (disabled ? 'Select a state first' : 'Search city…')}
          </span>
          <ChevronsUpDown className="ml-2 w-4 h-4 text-gray-400 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className={comboboxPopoverClass}
      >
        <Command shouldFilter={false} className="bg-white">
          <CommandInput
            placeholder="Type a city…"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-72 overflow-y-auto">
            <CommandEmpty className="py-4 text-center text-sm text-gray-500">
              No matching city.
            </CommandEmpty>
            <CommandGroup>
              {filtered.map((c) => {
                const key = `${c.name}|${c.stateCode}`;
                const selected = value === c.name;
                return (
                  <CommandItem
                    key={key}
                    value={key}
                    onSelect={() => {
                      onChange(c.name);
                      setSearch('');
                      setOpen(false);
                    }}
                    className={comboboxItemClass}
                  >
                    <Check
                      className={cn(
                        'mr-2 w-4 h-4 text-primary-600',
                        selected ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <span className="truncate text-gray-800">{c.name}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ── State Combobox ───────────────────────────────────────────────────────────

interface StateSelectProps {
  value: string;
  onChange: (stateName: string, stateCode: string) => void;
  disabled?: boolean;
  hasError?: boolean;
}

function StateSelect({ value, onChange, disabled, hasError }: StateSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return INDIAN_STATES;
    return INDIAN_STATES.filter((s) => s.name.toLowerCase().includes(q));
  }, [search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full flex items-center justify-between px-3 py-2 border rounded-lg bg-white text-left',
            'focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition',
            'disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-gray-50',
            hasError ? 'border-red-400' : 'border-gray-300',
          )}
        >
          <span className={cn('truncate', !value && 'text-gray-400')}>
            {value || 'Select state…'}
          </span>
          <ChevronsUpDown className="ml-2 w-4 h-4 text-gray-400 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className={comboboxPopoverClass}
      >
        <Command shouldFilter={false} className="bg-white">
          <CommandInput
            placeholder="Type a state…"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-72 overflow-y-auto">
            <CommandEmpty className="py-4 text-center text-sm text-gray-500">
              No matching state.
            </CommandEmpty>
            <CommandGroup>
              {filtered.map((s) => {
                const selected = value === s.name;
                return (
                  <CommandItem
                    key={s.isoCode}
                    value={s.name}
                    onSelect={() => {
                      onChange(s.name, s.isoCode);
                      setSearch('');
                      setOpen(false);
                    }}
                    className={comboboxItemClass}
                  >
                    <Check
                      className={cn(
                        'mr-2 w-4 h-4 text-primary-600',
                        selected ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <span className="truncate text-gray-800">{s.name}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ── Shared combobox styles ───────────────────────────────────────────────────

const comboboxPopoverClass =
  'p-0 w-[var(--radix-popover-trigger-width)] min-w-[260px] z-50 ' +
  'bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden';

const comboboxItemClass =
  'flex items-center gap-2 px-3 py-2 cursor-pointer rounded-md text-sm ' +
  'data-[selected=true]:bg-primary-50 data-[selected=true]:text-gray-900 ' +
  'aria-selected:bg-primary-50 hover:bg-primary-50';
