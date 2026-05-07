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

      <main className="relative px-4 pt-14 sm:pt-16 lg:pt-20 pb-16 sm:pb-20 bg-[#f5fbfb] overflow-hidden">

  {/* Hero Section */}
  <div className="max-w-4xl mx-auto text-center mb-10 sm:mb-14">
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 border border-primary-100 text-primary-600 text-sm font-medium mb-6">
      Partner With Scootyonrent
    </div>

    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-5 leading-tight">
      Build Your Rental Business
      <br />
      With Us
    </h1>

    <p className="text-sm sm:text-base lg:text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto px-2">
      Become a part of Scootyonrent’s growing mobility network and
      create a scalable rental business with operational support,
      technology, and trusted branding.
    </p>
  </div>

  <div className="max-w-7xl mx-auto">
    <div className="grid grid-cols-1 lg:grid-cols-5 rounded-[32px] overflow-hidden shadow-[0_20px_80px_rgba(0,0,0,0.08)] bg-white">

      {/* LEFT PANEL */}
      <div className="lg:col-span-2 bg-primary-500 relative overflow-hidden">

        {/* Background Effects */}
        <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-white/10"></div>

        <div className="absolute top-10 right-10 w-24 h-24 rounded-full border border-white/10"></div>

        <div className="relative z-10 p-6 sm:p-8 lg:p-10 h-full flex flex-col justify-between">

          <div>

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 border border-white/10 backdrop-blur-sm text-white text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-white"></span>
              Partnership Program
            </div>

            {/* Heading */}
            <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-5">
              Grow Faster
              <br />
              With Scootyonrent
            </h2>

            {/* Description */}
            <p className="text-white/80 text-sm sm:text-base leading-relaxed mb-10 max-w-md">
              Join our expanding mobility ecosystem and build a
              future-ready rental business backed by operational
              support, technology, and brand trust.
            </p>

            {/* Features */}
            <div className="space-y-7">

              {/* Feature */}
              <div className="flex items-start gap-4">
                <div className="min-w-[52px] h-12 rounded-2xl bg-white/15 border border-white/10 flex items-center justify-center backdrop-blur-sm">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>

                <div>
                  <h3 className="text-white font-semibold text-lg mb-1">
                    Trusted Brand Presence
                  </h3>

                  <p className="text-white/75 text-sm leading-relaxed">
                    Operate under a trusted and rapidly growing
                    scooter rental platform.
                  </p>
                </div>
              </div>

              {/* Feature */}
              <div className="flex items-start gap-4">
                <div className="min-w-[52px] h-12 rounded-2xl bg-white/15 border border-white/10 flex items-center justify-center backdrop-blur-sm">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>

                <div>
                  <h3 className="text-white font-semibold text-lg mb-1">
                    Operational Support
                  </h3>

                  <p className="text-white/75 text-sm leading-relaxed">
                    Receive complete onboarding, operational, and
                    technical assistance from our team.
                  </p>
                </div>
              </div>

              {/* Feature */}
              <div className="flex items-start gap-4">
                <div className="min-w-[52px] h-12 rounded-2xl bg-white/15 border border-white/10 flex items-center justify-center backdrop-blur-sm">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>

                <div>
                  <h3 className="text-white font-semibold text-lg mb-1">
                    Flexible Investment Models
                  </h3>

                  <p className="text-white/75 text-sm leading-relaxed">
                    Choose investment opportunities based on your
                    regional and business goals.
                  </p>
                </div>
              </div>

              {/* Feature */}
              <div className="flex items-start gap-4">
                <div className="min-w-[52px] h-12 rounded-2xl bg-white/15 border border-white/10 flex items-center justify-center backdrop-blur-sm">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>

                <div>
                  <h3 className="text-white font-semibold text-lg mb-1">
                    High Revenue Potential
                  </h3>

                  <p className="text-white/75 text-sm leading-relaxed">
                    Leverage increasing demand for urban mobility and
                    grow recurring revenue streams.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Bottom Stats */}
          <div className="grid grid-cols-3 gap-4 mt-12 pt-8 border-t border-white/10">

            <div>
              <h4 className="text-2xl sm:text-3xl font-bold text-white">
                24/7
              </h4>

              <p className="text-white/70 text-xs sm:text-sm mt-1">
                Support
              </p>
            </div>

            <div>
              <h4 className="text-2xl sm:text-3xl font-bold text-white">
                PAN
              </h4>

              <p className="text-white/70 text-xs sm:text-sm mt-1">
                India Reach
              </p>
            </div>

            <div>
              <h4 className="text-2xl sm:text-3xl font-bold text-white">
                Fast
              </h4>

              <p className="text-white/70 text-xs sm:text-sm mt-1">
                Growth
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* RIGHT FORM PANEL */}
      <div className="lg:col-span-3 bg-white">
        <div className="p-6 sm:p-8 md:p-10 lg:p-14">

          {submitted ? (
            <div className="flex flex-col items-center justify-center text-center py-16">

              <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10 text-primary-500" />
              </div>

              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Application Submitted Successfully
              </h2>

              <p className="text-gray-600 max-w-md leading-relaxed mb-8">
                Thank you for your interest in partnering with
                Scootyonrent. Our team will contact you shortly.
              </p>

              <Button
                onClick={() => setSubmitted(false)}
                className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-6 rounded-xl"
              >
                Submit Another Inquiry
              </Button>
            </div>
          ) : (
            <>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 sm:mb-10">
                Partnership Application
              </h2>

              <form
                onSubmit={handleSubmit}
                noValidate
                className="space-y-7"
              >

                {/* Name */}
                <div>
                  <Label
                    htmlFor="name"
                    className="text-gray-500 text-sm"
                  >
                    Full Name *
                  </Label>

                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) =>
                      setField('name', e.target.value)
                    }
                    maxLength={120}
                    disabled={isLoading}
                    className={`mt-3 border-0 border-b rounded-none px-0 py-3 shadow-none focus-visible:ring-0 bg-transparent text-base sm:text-lg ${
                      errors.name
                        ? 'border-red-400'
                        : 'border-gray-300 focus:border-primary-500'
                    }`}
                  />

                  {errors.name && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Phone + Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-7">

                  <div>
                    <Label
                      htmlFor="phoneNumber"
                      className="text-gray-500 text-sm"
                    >
                      Phone Number *
                    </Label>

                    <div className="mt-3">
                      <PhoneInput
                        id="phoneNumber"
                        value={form.phoneNumber}
                        onChange={(v) =>
                          setField('phoneNumber', v)
                        }
                        disabled={isLoading}
                        hasError={Boolean(errors.phoneNumber)}
                      />
                    </div>

                    {errors.phoneNumber && (
                      <p className="text-xs text-red-600 mt-1">
                        {errors.phoneNumber}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label
                      htmlFor="email"
                      className="text-gray-500 text-sm"
                    >
                      Email Address *
                    </Label>

                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        setField('email', e.target.value)
                      }
                      disabled={isLoading}
                      className={`mt-3 border-0 border-b rounded-none px-0 py-3 shadow-none focus-visible:ring-0 bg-transparent text-base sm:text-lg ${
                        errors.email
                          ? 'border-red-400'
                          : 'border-gray-300 focus:border-primary-500'
                      }`}
                    />

                    {errors.email && (
                      <p className="text-xs text-red-600 mt-1">
                        {errors.email}
                      </p>
                    )}
                  </div>

                </div>

                {/* State + City */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-7">

                  <div>
                    <Label className="text-gray-500 text-sm">
                      State *
                    </Label>

                    <div className="mt-3">
                      <StateSelect
                        value={form.state}
                        onChange={(stateName, stateCode) => {
                          setForm((prev) => ({
                            ...prev,
                            state: stateName,
                            stateCode,
                            city:
                              prev.stateCode === stateCode
                                ? prev.city
                                : '',
                          }));
                        }}
                        disabled={isLoading}
                        hasError={Boolean(errors.state)}
                      />
                    </div>

                    {errors.state && (
                      <p className="text-xs text-red-600 mt-1">
                        {errors.state}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label className="text-gray-500 text-sm">
                      City *
                    </Label>

                    <div className="mt-3">
                      <CitySelect
                        value={form.city}
                        stateCode={form.stateCode}
                        onChange={(cityName) =>
                          setField('city', cityName)
                        }
                        disabled={!form.stateCode || isLoading}
                        hasError={Boolean(errors.city)}
                      />
                    </div>

                    {errors.city && (
                      <p className="text-xs text-red-600 mt-1">
                        {errors.city}
                      </p>
                    )}
                  </div>

                </div>

                {/* Investment */}
                <div>
                  <Label className="text-gray-500 text-sm">
                    Investment Amount *
                  </Label>

                  <select
                    value={form.investmentAmount}
                    onChange={(e) =>
                      setField(
                        'investmentAmount',
                        e.target.value as
                          | InvestmentAmount
                          | ''
                      )
                    }
                    disabled={isLoading}
                    className={`mt-3 w-full border-0 border-b bg-transparent px-0 py-3 outline-none text-base sm:text-lg ${
                      errors.investmentAmount
                        ? 'border-red-400'
                        : 'border-gray-300 focus:border-primary-500'
                    }`}
                  >
                    <option value="">
                      Select an option
                    </option>

                    <option value="below_5_lakh">
                      Below 5 Lakh
                    </option>

                    <option value="above_5_lakh">
                      Above 5 Lakh
                    </option>
                  </select>

                  {errors.investmentAmount && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors.investmentAmount}
                    </p>
                  )}
                </div>

                {/* Vehicles */}
                <div className="pt-2">

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.ownsVehicles}
                      onChange={(e) => {
                        const checked =
                          e.target.checked;

                        setForm((prev) => ({
                          ...prev,
                          ownsVehicles: checked,
                          vehicleCount: checked
                            ? prev.vehicleCount
                            : '',
                        }));
                      }}
                      className="w-4 h-4 accent-primary-500"
                    />

                    <span className="text-gray-700">
                      Do you currently own vehicles?
                    </span>
                  </label>

                  {form.ownsVehicles && (
                    <div className="mt-5">

                      <Label className="text-gray-500 text-sm">
                        Number of Vehicles *
                      </Label>

                      <Input
                        type="number"
                        min={1}
                        value={form.vehicleCount}
                        onChange={(e) =>
                          setField(
                            'vehicleCount',
                            e.target.value
                          )
                        }
                        className={`mt-3 border-0 border-b rounded-none px-0 py-3 shadow-none focus-visible:ring-0 bg-transparent text-base sm:text-lg ${
                          errors.vehicleCount
                            ? 'border-red-400'
                            : 'border-gray-300 focus:border-primary-500'
                        }`}
                      />

                      {errors.vehicleCount && (
                        <p className="text-xs text-red-600 mt-1">
                          {errors.vehicleCount}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Agreements */}
                <div className="space-y-4 pt-4 border-t border-gray-100">

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.agreePrivacy}
                      onChange={(e) =>
                        setField(
                          'agreePrivacy',
                          e.target.checked
                        )
                      }
                      className="mt-1 w-4 h-4 accent-primary-500"
                    />

                    <span className="text-sm text-gray-700 leading-relaxed">
                      I agree to the Privacy Policy
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.agreeTerms}
                      onChange={(e) =>
                        setField(
                          'agreeTerms',
                          e.target.checked
                        )
                      }
                      className="mt-1 w-4 h-4 accent-primary-500"
                    />

                    <span className="text-sm text-gray-700 leading-relaxed">
                      I agree to the Terms & Conditions
                    </span>
                  </label>

                </div>

                {/* Submit */}
                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full sm:w-auto bg-primary-500 hover:bg-primary-600 text-white h-12 sm:h-14 px-8 sm:px-10 rounded-xl text-sm sm:text-base font-semibold shadow-lg hover:scale-[1.02] transition-all duration-300"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Application'
                    )}
                  </Button>
                </div>

              </form>
            </>
          )}
        </div>
      </div>

    </div>
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
