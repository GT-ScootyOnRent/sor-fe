import { useState } from 'react';
import Header from '../components/Header';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Mail, Phone, MapPin, Clock, AlertCircle } from 'lucide-react';
import BackgroundSlideshow from '../components/BackgroundSlideshow';
import { toast } from 'sonner';
import { isValidIndianMobile } from '../components/PhoneInput';

// ── Constants ───────────────────────────────────────────────────────────────

const NAME_MIN = 2;
const NAME_MAX = 50;
const SUBJECT_MAX = 100;
const MESSAGE_MIN = 10;
const MESSAGE_MAX = 1000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── Form state ──────────────────────────────────────────────────────────────

type FormState = {
  name: string;
  email: string;
  phone: string; // 10-digit national, +91 added on submit
  subject: string;
  message: string;
};

const EMPTY_FORM: FormState = {
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
};

// ── Page ────────────────────────────────────────────────────────────────────

export default function Contact() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  // ── Validation ───────────────────────────────────────────────────────────

  const validate = (): Partial<Record<keyof FormState, string>> => {
    const next: Partial<Record<keyof FormState, string>> = {};

    const nameTrim = form.name.trim();
    if (!nameTrim) next.name = 'Name is required';
    else if (nameTrim.length < NAME_MIN) next.name = `Name must be at least ${NAME_MIN} characters`;
    else if (nameTrim.length > NAME_MAX) next.name = `Name must be ${NAME_MAX} characters or fewer`;

    const emailTrim = form.email.trim();
    if (emailTrim && !EMAIL_RE.test(emailTrim)) {
      next.email = 'Enter a valid email address';
    }

    if (!form.phone) next.phone = 'Phone number is required';
    else if (form.phone.length !== 10) next.phone = 'Enter a 10-digit mobile number';
    else if (!isValidIndianMobile(form.phone)) next.phone = 'Enter a valid Indian mobile number';

    if (form.subject.length > SUBJECT_MAX) {
      next.subject = `Subject must be ${SUBJECT_MAX} characters or fewer`;
    }

    const msgTrim = form.message.trim();
    if (!msgTrim) next.message = 'Message is required';
    else if (msgTrim.length < MESSAGE_MIN) next.message = `Message must be at least ${MESSAGE_MIN} characters`;
    else if (form.message.length > MESSAGE_MAX) next.message = `Message must be ${MESSAGE_MAX} characters or fewer`;

    return next;
  };

  // ── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = validate();
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success('Thank you for your message!', {
        description: 'We will get back to you within 24 hours.',
      });
      setForm(EMPTY_FORM);
      setErrors({});
    } catch {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render helpers ───────────────────────────────────────────────────────

  const fieldClass = (hasError: boolean) =>
    `mt-3 border-0 border-b rounded-none px-0 py-3 shadow-none focus-visible:ring-0 bg-transparent text-base sm:text-lg ${
      hasError ? 'border-red-400' : 'border-gray-300 focus:border-primary-500'
    }`;

  const ErrorText = ({ msg }: { msg?: string }) =>
    msg ? (
      <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
        <AlertCircle className="w-3 h-3 shrink-0" />
        {msg}
      </p>
    ) : null;

  return (
    <div className="min-h-screen bg-[#f5fbfb] relative">
      <BackgroundSlideshow />

      <div className="relative z-10">
        <Header />

        <div className="overflow-x-hidden">
          {/* Hero */}
          <section className="pt-14 sm:pt-16 lg:pt-20 pb-8 sm:pb-10 px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-5 leading-tight">
                Get In Touch
              </h1>

              <p className="text-sm sm:text-base lg:text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto px-2">
                Have questions about rentals, bookings, or support? Our team is
                always ready to help you with quick assistance and smooth service.
              </p>
            </div>
          </section>

          {/* Main Card */}
          <section className="pb-14 sm:pb-20 px-4">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-5 rounded-[28px] overflow-hidden shadow-2xl bg-white">

                {/* LEFT SIDE */}
                <div className="lg:col-span-2 bg-primary-500 relative overflow-hidden">

                  <div className="absolute -bottom-20 -right-20 w-56 sm:w-72 h-56 sm:h-72 rounded-full bg-white/20"></div>

                  <div className="relative z-10 p-6 sm:p-8 lg:p-10 h-full flex flex-col justify-between">

                    <div>
                      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                        Contact Information
                      </h2>

                      <p className="text-white/80 text-sm sm:text-base leading-relaxed mb-10">
                        Feel free to contact us anytime. We'll get back to you as
                        soon as possible.
                      </p>

                      <div className="space-y-7">
                        <div className="flex items-start gap-4">
                          <div className="min-w-[48px] h-12 rounded-full bg-white/20 flex items-center justify-center">
                            <Phone className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-white font-semibold text-base sm:text-lg mb-1">
                              Phone
                            </h3>
                            <p className="text-white/80 text-sm sm:text-base">+91 9983391137</p>
                            <p className="text-white/80 text-sm sm:text-base">+91 98765 43211</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4">
                          <div className="min-w-[48px] h-12 rounded-full bg-white/20 flex items-center justify-center">
                            <Mail className="w-5 h-5 text-white" />
                          </div>
                          <div className="break-all">
                            <h3 className="text-white font-semibold text-base sm:text-lg mb-1">
                              Email
                            </h3>
                            <p className="text-white/80 text-sm sm:text-base">info@scootyonrent.com</p>
                            <p className="text-white/80 text-sm sm:text-base">support@scootyonrent.com</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4">
                          <div className="min-w-[48px] h-12 rounded-full bg-white/20 flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-white font-semibold text-base sm:text-lg mb-1">
                              Office Address
                            </h3>
                            <p className="text-white/80 text-sm sm:text-base leading-relaxed">
                              123, Main Road,<br />City Center,<br />India - 313001
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4">
                          <div className="min-w-[48px] h-12 rounded-full bg-white/20 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-white font-semibold text-base sm:text-lg mb-1">
                              Business Hours
                            </h3>
                            <p className="text-white/80 text-sm sm:text-base">Monday - Sunday</p>
                            <p className="text-white/80 text-sm sm:text-base">8:00 AM - 8:00 PM</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT SIDE FORM */}
                <div className="lg:col-span-3 bg-white">
                  <div className="p-6 sm:p-8 md:p-10 lg:p-14">

                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 sm:mb-10">
                      Send Message
                    </h2>

                    <form onSubmit={handleSubmit} noValidate className="space-y-7 sm:space-y-8">

                      {/* Row: Name + Email */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-7 sm:gap-8">
                        <div>
                          <Label htmlFor="name" className="text-gray-500 text-sm">
                            Your Name *
                          </Label>
                          <Input
                            id="name"
                            type="text"
                            placeholder="John Doe"
                            value={form.name}
                            onChange={(e) => setField('name', e.target.value)}
                            maxLength={NAME_MAX}
                            disabled={isSubmitting}
                            className={fieldClass(!!errors.name)}
                          />
                          <ErrorText msg={errors.name} />
                        </div>

                        <div>
                          <Label htmlFor="email" className="text-gray-500 text-sm">
                            Your Email <span className="text-gray-400 text-xs font-normal">(optional)</span>
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="hello@example.com"
                            value={form.email}
                            onChange={(e) => setField('email', e.target.value)}
                            disabled={isSubmitting}
                            className={fieldClass(!!errors.email)}
                          />
                          <ErrorText msg={errors.email} />
                        </div>
                      </div>

                      {/* Phone — static +91 prefix + 10-digit input */}
                      <div>
                        <Label htmlFor="phone" className="text-gray-500 text-sm">
                          Phone Number *
                        </Label>
                        <div
                          className={`mt-3 flex items-stretch border-b transition-colors ${
                            errors.phone
                              ? 'border-red-400'
                              : 'border-gray-300 focus-within:border-primary-500'
                          }`}
                        >
                          <span className="flex items-center pr-3 text-base sm:text-lg text-gray-500 font-medium select-none">
                            +91
                          </span>
                          <input
                            id="phone"
                            type="tel"
                            inputMode="numeric"
                            autoComplete="tel-national"
                            placeholder="9876543210"
                            value={form.phone}
                            onChange={(e) =>
                              setField('phone', e.target.value.replace(/\D/g, '').slice(0, 10))
                            }
                            maxLength={10}
                            disabled={isSubmitting}
                            className="flex-1 border-0 bg-transparent py-3 outline-none text-base sm:text-lg placeholder:text-gray-400"
                          />
                        </div>
                        {errors.phone ? (
                          <ErrorText msg={errors.phone} />
                        ) : (
                          <p className="mt-1 text-xs text-gray-400">
                            Enter a valid 10-digit Indian mobile number.
                          </p>
                        )}
                      </div>

                      {/* Subject */}
                      <div>
                        <Label htmlFor="subject" className="text-gray-500 text-sm">
                          Subject <span className="text-gray-400 text-xs font-normal">(optional)</span>
                        </Label>
                        <Input
                          id="subject"
                          type="text"
                          placeholder="How can we help you?"
                          value={form.subject}
                          onChange={(e) => setField('subject', e.target.value)}
                          maxLength={SUBJECT_MAX}
                          disabled={isSubmitting}
                          className={fieldClass(!!errors.subject)}
                        />
                        <ErrorText msg={errors.subject} />
                      </div>

                      {/* Message — with live char counter, capped at 1000 */}
                      <div>
                        <Label htmlFor="message" className="text-primary-500 text-sm">
                          Message *
                        </Label>
                        <Textarea
                          id="message"
                          placeholder="Write your message here..."
                          value={form.message}
                          onChange={(e) => setField('message', e.target.value)}
                          maxLength={MESSAGE_MAX}
                          rows={5}
                          disabled={isSubmitting}
                          className={`mt-3 border-0 border-b rounded-none px-0 resize-none shadow-none focus-visible:ring-0 bg-transparent text-base sm:text-lg ${
                            errors.message
                              ? 'border-red-400'
                              : 'border-gray-300 focus:border-primary-500'
                          }`}
                        />
                        <div className="mt-1 flex justify-between text-xs">
                          {errors.message ? (
                            <span className="text-red-600 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 shrink-0" />
                              {errors.message}
                            </span>
                          ) : (
                            <span className="text-gray-400">
                              Minimum {MESSAGE_MIN} characters.
                            </span>
                          )}
                          <span
                            className={
                              form.message.length > MESSAGE_MAX
                                ? 'text-red-600'
                                : form.message.length > MESSAGE_MAX * 0.9
                                ? 'text-amber-600'
                                : 'text-gray-400'
                            }
                          >
                            {form.message.length}/{MESSAGE_MAX}
                          </span>
                        </div>
                      </div>

                      {/* Submit */}
                      <div className="pt-2 sm:pt-4">
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full sm:w-auto bg-primary-500 hover:bg-primary-600 text-white h-12 sm:h-14 px-8 sm:px-10 rounded-xl text-sm sm:text-base font-semibold shadow-lg hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100"
                        >
                          {isSubmitting ? 'Sending...' : 'Send Message'}
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
