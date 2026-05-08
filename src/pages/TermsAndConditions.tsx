import React from 'react';
import {
  ArrowLeft,
  Shield,
  AlertTriangle,
  AlertOctagon,
  FileText,
  Clock,
  MapPin,
  CreditCard,
  Ban,
  CheckCircle2,
  XCircle,
  Fuel,
  Wrench,
  HardHat,
  Info,
  Phone,
  Edit3,
  Gavel,
  Radio,
  RefreshCcw,
  Scale,
  Mail,
  AlertCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import BackgroundSlideshow from '../components/BackgroundSlideshow';

// ── Design system primitives ───────────────────────────────────────────────

type Tone = 'default' | 'highlight' | 'warning' | 'danger' | 'success';

const TONE_CLASSES: Record<Tone, { card: string; iconWrap: string; icon: string }> = {
  default:   { card: 'bg-gray-50 border-gray-200',         iconWrap: 'bg-white border border-gray-200', icon: 'text-gray-600' },
  highlight: { card: 'bg-primary-50/60 border-primary-200', iconWrap: 'bg-white border border-primary-200', icon: 'text-primary-600' },
  warning:   { card: 'bg-amber-50 border-amber-200',       iconWrap: 'bg-white border border-amber-200',  icon: 'text-amber-600' },
  danger:    { card: 'bg-red-50 border-red-200',           iconWrap: 'bg-white border border-red-200',    icon: 'text-red-600' },
  success:   { card: 'bg-emerald-50 border-emerald-200',   iconWrap: 'bg-white border border-emerald-200',icon: 'text-emerald-600' },
};

interface SectionHeaderProps {
  icon: React.ElementType;
  number: number | string;
  title: string;
}
const SectionHeader: React.FC<SectionHeaderProps> = ({ icon: Icon, number, title }) => (
  <div className="flex items-center gap-3 pb-3 mb-5 border-b border-gray-200">
    <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center shrink-0">
      <Icon className="w-5 h-5 text-primary-600" />
    </div>
    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
      <span className="text-primary-500">{number}.</span> {title}
    </h2>
  </div>
);

interface CalloutProps {
  tone?: Tone;
  icon?: React.ElementType;
  title?: string;
  children: React.ReactNode;
}
const Callout: React.FC<CalloutProps> = ({ tone = 'default', icon: Icon, title, children }) => {
  const t = TONE_CLASSES[tone];
  return (
    <div className={`border rounded-xl p-4 sm:p-5 ${t.card}`}>
      {(Icon || title) && (
        <div className="flex items-center gap-2 mb-2">
          {Icon && <Icon className={`w-5 h-5 shrink-0 ${t.icon}`} />}
          {title && <p className="font-semibold text-gray-900">{title}</p>}
        </div>
      )}
      <div className="text-sm sm:text-base text-gray-700 space-y-2 leading-relaxed">
        {children}
      </div>
    </div>
  );
};

interface NumberedCardProps {
  number: number;
  icon: React.ElementType;
  title: string;
  tone?: Tone;
  children: React.ReactNode;
}
const NumberedCard: React.FC<NumberedCardProps> = ({ number, icon: Icon, title, tone = 'default', children }) => {
  const t = TONE_CLASSES[tone];
  return (
    <div className={`relative border rounded-xl p-5 ${t.card} h-full`}>
      <div className="flex items-start gap-3 mb-2">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${t.iconWrap}`}>
          <Icon className={`w-5 h-5 ${t.icon}`} />
        </div>
        <div className="min-w-0">
          <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-gray-500">
            #{number}
          </span>
          <h3 className="text-base font-bold text-gray-900 leading-snug">{title}</h3>
        </div>
      </div>
      <div className="text-sm text-gray-700 leading-relaxed space-y-2">
        {children}
      </div>
    </div>
  );
};

const KeyPair: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex items-baseline gap-2">
    <span className="font-semibold text-gray-900 shrink-0">{label}:</span>
    <span className="text-gray-700">{value}</span>
  </div>
);

const CheckList: React.FC<{ items: React.ReactNode[]; tone?: 'success' | 'danger' }> = ({
  items,
  tone = 'success',
}) => {
  const Icon = tone === 'success' ? CheckCircle2 : XCircle;
  const colour = tone === 'success' ? 'text-emerald-600' : 'text-red-600';
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm sm:text-base text-gray-700">
          <Icon className={`w-4 h-4 mt-1 shrink-0 ${colour}`} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
};

// ── Page ────────────────────────────────────────────────────────────────────

const TermsAndConditions: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white relative">
      <BackgroundSlideshow />
      <div className="relative z-10">
        <Header />

        <div className="container mx-auto px-4 py-8 max-w-5xl">
          {/* Back */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-primary-500 hover:text-primary-600 mb-6 transition"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>

          {/* Hero */}
          <div className="bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-2xl p-8 mb-8 shadow-lg">
            <div className="flex items-center mb-4">
              <FileText className="w-10 h-10 mr-4" />
              <h1 className="text-3xl sm:text-4xl font-bold">Terms & Conditions</h1>
            </div>
            <p className="text-primary-100">
              Last updated:{' '}
              {new Date().toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <p className="mt-2 text-primary-100">
              Please read these terms and conditions carefully before using scootyonrent service.
            </p>
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 space-y-10">

            {/* 1. Acceptance of Terms */}
            <section>
              <SectionHeader icon={Shield} number={1} title="Acceptance of Terms" />
              <p className="text-gray-700 leading-relaxed">
                By accessing and using scootyonrent services, you accept and agree to be bound by the
                terms and provisions of this agreement. If you do not agree to these terms, please do
                not use our services.
              </p>
            </section>

            {/* reCAPTCHA */}
            <section>
              <SectionHeader icon={Shield} number="—" title="reCAPTCHA" />
              <p className="text-gray-700 leading-relaxed">
                We use Google reCAPTCHA to help protect our website from fraud and abuse. Your use of
                reCAPTCHA is subject to Google's{' '}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 underline hover:text-primary-700"
                >
                  Privacy Policy
                </a>{' '}
                and{' '}
                <a
                  href="https://policies.google.com/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 underline hover:text-primary-700"
                >
                  Terms of Service
                </a>
                .
              </p>
            </section>

            {/* 2. Booking Process */}
            <section>
              <SectionHeader icon={Clock} number={2} title="Booking Process" />
              <p className="text-gray-700 leading-relaxed mb-4">
                All bookings must be made through our website or mobile application. Offline booking
                requests will not be entertained under any circumstances.
              </p>
              <Callout>
                <CheckList
                  items={[
                    'Minimum booking duration is 4 hours',
                    'Bookings can be made online through our platform only',
                    'Confirmation will be sent via email/SMS after successful payment',
                    'Booking reference number must be presented at pickup',
                  ]}
                />
              </Callout>
            </section>

            {/* 3. Payment Process */}
            <section>
              <SectionHeader icon={CreditCard} number={3} title="Payment Process" />
              <p className="text-gray-700 leading-relaxed mb-4">
                Rental charges must be paid in advance through our secure payment gateway (Razorpay).
                We accept:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {['Credit / Debit Cards', 'UPI', 'Net Banking', 'Digital Wallets'].map((m) => (
                  <div
                    key={m}
                    className="border border-gray-200 rounded-lg px-3 py-3 text-center text-sm font-medium text-gray-700 bg-gray-50"
                  >
                    {m}
                  </div>
                ))}
              </div>
              <Callout tone="highlight" icon={Info} title="Security Deposit">
                <p>
                  A refundable security deposit of <strong>₹2,000</strong> will be collected at the
                  time of vehicle pickup.
                </p>
              </Callout>
            </section>

            {/* 4. Required Documents */}
            <section>
              <SectionHeader icon={FileText} number={4} title="Required Documents" />
              <p className="text-gray-700 leading-relaxed mb-4">
                At the time of vehicle pickup, riders must carry:
              </p>
              <Callout tone="warning" icon={AlertTriangle} title="Carry these originals">
                <CheckList
                  items={[
                    <>
                      <strong>Valid Permanent Driving License</strong> — two-wheeler license with chip.
                      Learning licenses are <em>not</em> accepted.
                    </>,
                    <>
                      <strong>Government-Issued ID</strong> — Aadhaar Card, PAN Card, or Passport.
                    </>,
                    <>
                      <strong>Address Proof</strong> — if different from ID, provide a utility bill or
                      rent agreement.
                    </>,
                    <>
                      <strong>Age Requirement</strong> — minimum 18 years old.
                    </>,
                  ]}
                />
              </Callout>
              <Callout tone="danger" icon={AlertOctagon} title="No-license penalty">
                <p>
                  No refund of booking amount if the customer fails to submit the original driving
                  license at pickup.
                </p>
              </Callout>
            </section>

            {/* 5. Delay, Extension & Penalty */}
            <section>
              <SectionHeader icon={Clock} number={5} title="Delay, Extension & Penalty" />
              <p className="text-gray-700 leading-relaxed mb-4">
                Customers are requested to avoid any delays to help us fulfill delivery commitments
                for subsequent bookings.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <NumberedCard number={1} icon={RefreshCcw} title="Extension">
                  <p>Bookings can be extended before completion through the app or website.</p>
                </NumberedCard>
                <NumberedCard number={2} icon={AlertTriangle} title="Late Return Penalty" tone="warning">
                  <p>
                    <strong>₹100 / hour</strong> for delays without a prior extension.
                  </p>
                </NumberedCard>
                <NumberedCard number={3} icon={Clock} title="Grace Period" tone="success">
                  <p>
                    <strong>15 minutes</strong> without penalty.
                  </p>
                </NumberedCard>
              </div>
              <p className="text-sm text-gray-600 mt-4">
                Delays in drop-off will not be waived due to delays in pickup. In such cases, customers
                must cancel the previous booking and create a new one.
              </p>
            </section>

            {/* 6. Traffic Rules & Violations */}
            <section>
              <SectionHeader icon={AlertTriangle} number={6} title="Traffic Rules & Violations" />
              <p className="text-gray-700 leading-relaxed mb-4">
                All vehicles are equipped with GPS tracking. Riders must follow traffic rules and
                speed limits set by government regulations. Penalties incurred are passed to the
                rider:
              </p>
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-700 uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Violation</th>
                      <th className="px-4 py-3 text-right font-semibold">Penalty Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[
                      ['Exceeding speed limit', '₹1,000'],
                      ['Riding with more than 2 persons', '₹1,000'],
                      ['Drink and drive', '₹10,000'],
                      ['Jumping red light', '₹1,000 – ₹5,000'],
                      ['Vehicle impounded by authorities', '₹1,500 + legal charges'],
                    ].map(([violation, fine]) => (
                      <tr key={violation} className="bg-white hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-800">{violation}</td>
                        <td className="px-4 py-3 text-right font-semibold text-red-600">{fine}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 7. Geographic Restrictions — REDESIGNED (was rainbow stack) */}
            <section>
              <SectionHeader icon={MapPin} number={7} title="Geographic Restrictions" />
              <p className="text-gray-700 leading-relaxed mb-5">
                Vehicles must remain within the rented city's limits. Geographic violations are
                tracked via on-board GPS and treated as serious breaches of the rental agreement.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <NumberedCard number={1} icon={MapPin} title="City Limits Only">
                  <p>
                    All rented vehicles must remain within the city limits of the pickup location
                    throughout the rental period.
                  </p>
                </NumberedCard>

                <NumberedCard number={2} icon={Ban} title="No Intercity Travel" tone="warning">
                  <p>
                    Taking the vehicle outside the designated city boundaries is strictly prohibited
                    without prior written approval from Scootyonrent.
                  </p>
                </NumberedCard>

                <NumberedCard
                  number={3}
                  icon={AlertOctagon}
                  title="Violation Consequences"
                  tone="danger"
                >
                  <CheckList
                    tone="danger"
                    items={[
                      'Immediate termination of the rental agreement',
                      'Full liability for damages, accidents, or incidents outside city limits',
                      'Additional penalty charges as determined by Scootyonrent',
                      'Forfeiture of security deposit',
                      'Legal action may be taken if necessary',
                    ]}
                  />
                </NumberedCard>

                <NumberedCard number={4} icon={Radio} title="GPS Tracking">
                  <p>
                    Vehicles may be equipped with GPS tracking devices to monitor location. Any
                    detected violation of geographic restrictions will result in immediate action.
                  </p>
                </NumberedCard>

                <NumberedCard
                  number={5}
                  icon={Phone}
                  title="Emergency Exception"
                  tone="success"
                >
                  <p>
                    In case of a genuine emergency requiring travel outside city limits, the renter
                    must immediately contact Scootyonrent support for approval before proceeding.
                  </p>
                </NumberedCard>
              </div>
            </section>

            {/* 8. Prohibited Uses */}
            <section>
              <SectionHeader icon={Ban} number={8} title="Prohibited Uses" />
              <p className="text-gray-700 leading-relaxed mb-4">
                The following uses are strictly prohibited:
              </p>
              <Callout tone="danger" icon={XCircle} title="Not allowed">
                <CheckList
                  tone="danger"
                  items={[
                    'Use for rallies, competitions, or professional events',
                    'Commercial use without prior written permission',
                    'Operation under the influence of alcohol, drugs, or impairing medication',
                    'Use in any criminal or illegal activity',
                    'Subleasing or transferring the vehicle to third parties',
                    'Off-road or stunt riding',
                  ]}
                />
              </Callout>
            </section>

            {/* 9. Fuel Policy */}
            <section>
              <SectionHeader icon={Fuel} number={9} title="Fuel Policy" />
              <p className="text-gray-700 leading-relaxed mb-4">
                Fuel is the responsibility of the customer. The vehicle will be provided with
                sufficient fuel to reach the nearest fuel station.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <NumberedCard number={1} icon={CheckCircle2} title="Pickup" tone="success">
                  <p>Vehicle is provided with fuel sufficient to reach the nearest pump.</p>
                </NumberedCard>
                <NumberedCard number={2} icon={Fuel} title="Return">
                  <p>Vehicle must be returned with enough fuel for the next customer.</p>
                </NumberedCard>
                <NumberedCard number={3} icon={AlertTriangle} title="Insufficient Fuel" tone="warning">
                  <p>
                    A flat <strong>₹30</strong> charge applies if returned without minimum fuel.
                  </p>
                </NumberedCard>
              </div>
              <p className="text-sm text-gray-600 mt-4">
                We do not have facilities to siphon extra fuel or purchase fuel left in the tank at
                return.
              </p>
            </section>

            {/* 10. Cancellation & Refund */}
            <section>
              <SectionHeader icon={RefreshCcw} number={10} title="Cancellation & Refund Policy" />
              <p className="text-gray-700 leading-relaxed mb-4">
                Cancellation requests can be made through the website / app:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <NumberedCard number={1} icon={CheckCircle2} title="Free Cancellation" tone="success">
                  <p>Up to <strong>24 hours</strong> before pickup time.</p>
                </NumberedCard>
                <NumberedCard number={2} icon={AlertTriangle} title="50% Refund" tone="warning">
                  <p><strong>12 – 24 hours</strong> before pickup time.</p>
                </NumberedCard>
                <NumberedCard number={3} icon={XCircle} title="No Refund" tone="danger">
                  <p>Less than <strong>12 hours</strong> before pickup, or no-show.</p>
                </NumberedCard>
              </div>
              <Callout tone="default">
                <KeyPair
                  label="Refund Processing"
                  value="Approved refunds are processed within 5–7 business days to the original payment method."
                />
              </Callout>
              <p className="text-sm text-red-600 mt-3">
                Bookings not picked up within 1 hour of scheduled time will be automatically
                cancelled without refund.
              </p>
            </section>

            {/* 11. Vehicle Damage & Security */}
            <section>
              <SectionHeader icon={Wrench} number={11} title="Vehicle Damage & Security" />
              <p className="text-gray-700 leading-relaxed mb-4">
                The rider is responsible for the vehicle's safety during the rental period.
              </p>
              <div className="space-y-4">
                <Callout tone="warning" icon={AlertTriangle} title="Rider Responsibilities">
                  <CheckList
                    items={[
                      'Inspect vehicle for damages before accepting',
                      'Report any damages immediately with photographic evidence',
                      'Liable for damage, loss, or theft during the rental period',
                      'Responsible for parking fines and traffic violations',
                    ]}
                  />
                </Callout>
                <Callout tone="danger" icon={AlertOctagon} title="Accident / Collision">
                  <CheckList
                    tone="danger"
                    items={[
                      'Inform Scootyonrent and the police immediately',
                      'Rider is accountable for repair costs',
                      'Insurance liability beyond ₹10,000',
                      'Vehicle downtime charges apply until repaired',
                    ]}
                  />
                </Callout>
                <Callout tone="default" icon={Info} title="Lost Keys">
                  <p>
                    <strong>₹1,150</strong> for a new lockset + <strong>₹50</strong> transportation
                    charges.
                  </p>
                </Callout>
              </div>
            </section>

            {/* 12. Helmet Policy */}
            <section>
              <SectionHeader icon={HardHat} number={12} title="Helmet Policy" />
              <Callout tone="highlight">
                <CheckList
                  items={[
                    <>
                      <strong>One helmet</strong> provided free with each booking
                    </>,
                    <>
                      Additional helmets: <strong>₹50</strong> per helmet
                    </>,
                    <>
                      Lost / damaged helmet: <strong>₹450</strong> charge
                    </>,
                    'Helmets must be returned in good condition',
                  ]}
                />
              </Callout>
            </section>

            {/* 13. Operating Hours */}
            <section>
              <SectionHeader icon={Clock} number={13} title="Operating Hours" />
              <Callout tone="highlight" icon={Clock} title="Pickup / Drop centres">
                <p className="text-2xl font-bold text-primary-700">9:00 AM – 8:00 PM</p>
                <p className="text-gray-600">All days of the week.</p>
              </Callout>
              <p className="text-sm text-gray-600 mt-3">
                Vehicle returns after 8:00 PM are not accepted. Late returns must be completed by
                9:00 AM the next morning with applicable penalties.
              </p>
            </section>

            {/* 14. Assumption of Risk */}
            <section>
              <SectionHeader icon={AlertOctagon} number={14} title="Assumption of Risk" />
              <p className="text-gray-700 leading-relaxed mb-4">
                By accepting these terms, the rider acknowledges and accepts:
              </p>
              <Callout tone="danger" >
                <CheckList
                  tone="danger"
                  items={[
                    'Operating a two-wheeler involves inherent risks',
                    'Serious injury or death may result from accidents',
                    'Rider voluntarily assumes all risks associated with vehicle operation',
                    'Rider is responsible for examining vehicle condition before use',
                    'Rider agrees to operate the vehicle safely and within legal limits',
                  ]}
                />
              </Callout>
            </section>

            {/* 15. Liability Disclaimer */}
            <section>
              <SectionHeader icon={Scale} number={15} title="Liability Disclaimer" />
              <p className="text-gray-700 leading-relaxed mb-4">
                Scootyonrent shall not be liable for:
              </p>
              <Callout>
                <CheckList
                  tone="danger"
                  items={[
                    'Personal injury or death resulting from vehicle operation',
                    'Loss or damage to personal belongings',
                    'Indirect, consequential, or incidental damages',
                    'Losses due to vehicle breakdown or mechanical failure (assistance is provided)',
                  ]}
                />
              </Callout>
            </section>

            {/* 16. Amendments */}
            <section>
              <SectionHeader icon={Edit3} number={16} title="Amendments to Terms" />
              <p className="text-gray-700 leading-relaxed">
                Scootyonrent reserves the right to modify these terms at any time. Continued use of
                services after modifications constitutes acceptance of the updated terms. Users will
                be notified of significant changes via email or website notification.
              </p>
            </section>

            {/* Contact */}
            <section className="bg-gradient-to-br from-primary-50 to-indigo-50 border border-primary-200 rounded-2xl p-6 sm:p-8">
              <SectionHeader icon={Phone} number="✉" title="Contact Us" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-gray-700">
                <KeyPair label="Company" value="scootyonrent" />
                <KeyPair label="Phone" value="+91 9983391137" />
                <KeyPair
                  label="Email"
                  value={
                    <a
                      href="mailto:support@scootyonrent.com"
                      className="text-primary-600 hover:underline inline-flex items-center gap-1"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      support@scootyonrent.com
                    </a>
                  }
                />
                <KeyPair label="Address" value="Udaipur, Rajasthan, India" />
                <KeyPair label="Customer Support" value="9:00 AM – 8:00 PM (All Days)" />
              </div>
            </section>

            {/* Agreement Notice */}
            <div className="bg-gray-900 text-white rounded-2xl p-6 text-center flex items-start sm:items-center gap-3 justify-center">
              <Gavel className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 text-primary-300" />
              <p className="text-sm">
                By clicking <strong>"Book Now"</strong> or using our services, you acknowledge that
                you have read, understood, and agree to be bound by these Terms & Conditions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
