import React from 'react';
import { ArrowLeft, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import BackgroundSlideshow from '../components/BackgroundSlideshow';

const TermsAndConditions: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white relative">
      <BackgroundSlideshow />
      <div className="relative z-10">
        <Header />

        <div className="container mx-auto px-4 py-8 max-w-4xl">
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
          <article className="bg-white rounded-2xl shadow-lg p-6 sm:p-10 prose-terms">
            {/* 1. Acceptance of Terms */}
            <section className="mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                1. Acceptance of Terms
              </h2>
              <p className="text-gray-700 leading-relaxed">
                By accessing and using scootyonrent services, you accept and agree to be bound by the
                terms and provisions of this agreement. If you do not agree to these terms, please
                do not use our services.
              </p>
            </section>

            {/* reCAPTCHA */}
            <section className="mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">reCAPTCHA</h2>
              <p className="text-gray-700 leading-relaxed">
                We use Google reCAPTCHA to help protect our website from fraud and abuse. Your use
                of reCAPTCHA is subject to Google's{' '}
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
            <section className="mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                2. Booking Process
              </h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                All bookings must be made through our website or mobile application. Offline booking
                requests will not be entertained under any circumstances.
              </p>
              <ul className="list-disc list-outside ml-6 space-y-1 text-gray-700">
                <li>Minimum booking duration is 4 hours.</li>
                <li>Bookings can be made online through our platform only.</li>
                <li>Confirmation will be sent via email or SMS after successful payment.</li>
                <li>Booking reference number must be presented at pickup.</li>
              </ul>
            </section>

            {/* 3. Payment Process */}
            <section className="mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                3. Payment Process
              </h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                Rental charges must be paid in advance through our secure payment gateway
                (Razorpay). We accept:
              </p>
              <ul className="list-disc list-outside ml-6 space-y-1 text-gray-700 mb-3">
                <li>Credit / Debit Cards</li>
                <li>UPI (Google Pay, PhonePe, Paytm, etc.)</li>
                <li>Net Banking</li>
                <li>Digital Wallets</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                <strong>Security Deposit:</strong> A refundable security deposit of ₹2,000 will be
                collected at the time of vehicle pickup.
              </p>
            </section>

            {/* 4. Required Documents */}
            <section className="mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                4. Required Documents
              </h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                At the time of vehicle pickup, riders must carry:
              </p>
              <ul className="list-disc list-outside ml-6 space-y-1 text-gray-700 mb-3">
                <li>
                  <strong>Valid Permanent Driving License:</strong> Two-wheeler driving license with
                  chip. Learning licenses are not accepted.
                </li>
                <li>
                  <strong>Government-Issued ID:</strong> Aadhaar Card, PAN Card, or Passport.
                </li>
                <li>
                  <strong>Address Proof:</strong> If different from ID, provide a utility bill or
                  rent agreement.
                </li>
                <li>
                  <strong>Age Requirement:</strong> Minimum 18 years old.
                </li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                No refund of the booking amount if the customer fails to submit the original driving
                license at pickup.
              </p>
            </section>

            {/* 5. Delay, Extension & Penalty */}
            <section className="mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                5. Delay, Extension & Penalty
              </h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                Customers are requested to avoid any delays to help us fulfill delivery commitments
                for subsequent bookings.
              </p>
              <ul className="list-disc list-outside ml-6 space-y-1 text-gray-700 mb-3">
                <li>
                  <strong>Extension:</strong> Bookings can be extended before completion through the
                  app or website.
                </li>
                <li>
                  <strong>Late Return Penalty:</strong> ₹100 per hour for delays without a prior
                  extension.
                </li>
                <li>
                  <strong>Maximum Grace Period:</strong> 15 minutes without penalty.
                </li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                Delays in drop-off will not be waived due to delays in pickup. In such cases,
                customers must cancel the previous booking and create a new one.
              </p>
            </section>

            {/* 6. Traffic Rules & Violations */}
            <section className="mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                6. Traffic Rules & Violations
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                All vehicles are equipped with GPS tracking. Riders must follow traffic rules and
                speed limits set by government regulations. Penalties incurred are passed to the
                rider:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="py-2 px-3 text-left font-semibold text-gray-900">Violation</th>
                      <th className="py-2 px-3 text-right font-semibold text-gray-900">
                        Penalty Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700">
                    {[
                      ['Exceeding speed limit', '₹1,000'],
                      ['Riding with more than 2 persons', '₹1,000'],
                      ['Drink and drive', '₹10,000'],
                      ['Jumping red light', '₹1,000 – ₹5,000'],
                      ['Vehicle impounded by authorities', '₹1,500 + legal charges'],
                    ].map(([violation, fine]) => (
                      <tr key={violation} className="border-b border-gray-200">
                        <td className="py-2 px-3">{violation}</td>
                        <td className="py-2 px-3 text-right">{fine}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 7. Geographic Restrictions */}
            <section className="mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                7. Geographic Restrictions
              </h2>
              <ol className="list-decimal list-outside ml-6 space-y-3 text-gray-700">
                <li>
                  <strong>City Limits Only:</strong> All rented vehicles must remain within the city
                  limits of the pickup location throughout the rental period.
                </li>
                <li>
                  <strong>No Intercity Travel:</strong> Taking the vehicle outside the designated
                  city boundaries is strictly prohibited without prior written approval from
                  Scootyonrent.
                </li>
                <li>
                  <strong>Violation Consequences:</strong>
                  <ul className="list-disc list-outside ml-6 mt-2 space-y-1">
                    <li>Immediate termination of the rental agreement.</li>
                    <li>
                      Full liability for any damages, accidents, or incidents occurring outside city
                      limits.
                    </li>
                    <li>Additional penalty charges as determined by Scootyonrent.</li>
                    <li>Forfeiture of security deposit.</li>
                    <li>Legal action may be taken if necessary.</li>
                  </ul>
                </li>
                <li>
                  <strong>Tracking:</strong> Vehicles may be equipped with GPS tracking devices to
                  monitor location. Any detected violation of geographic restrictions will result in
                  immediate action.
                </li>
                <li>
                  <strong>Emergency Exception:</strong> In case of a genuine emergency requiring
                  travel outside city limits, the renter must immediately contact Scootyonrent
                  support for approval before proceeding.
                </li>
              </ol>
            </section>

            {/* 8. Prohibited Uses */}
            <section className="mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                8. Prohibited Uses
              </h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                The following uses are strictly prohibited:
              </p>
              <ul className="list-disc list-outside ml-6 space-y-1 text-gray-700">
                <li>Use for rallies, competitions, or professional events.</li>
                <li>Commercial use without prior written permission.</li>
                <li>Operation under the influence of alcohol, drugs, or impairing medication.</li>
                <li>Use in any criminal or illegal activity.</li>
                <li>Subleasing or transferring the vehicle to third parties.</li>
                <li>Off-road or stunt riding.</li>
              </ul>
            </section>

            {/* 9. Fuel Policy */}
            <section className="mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">9. Fuel Policy</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                Fuel is the responsibility of the customer. The vehicle will be provided with
                sufficient fuel to reach the nearest fuel station.
              </p>
              <ul className="list-disc list-outside ml-6 space-y-1 text-gray-700 mb-3">
                <li>
                  <strong>Pickup:</strong> Vehicle provided with fuel to reach the nearest pump.
                </li>
                <li>
                  <strong>Return:</strong> Vehicle must be returned with enough fuel for the next
                  customer (minimum to reach the pump).
                </li>
                <li>
                  <strong>Insufficient Fuel at Return:</strong> ₹30 will be charged.
                </li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                We do not have facilities to siphon extra fuel or purchase fuel left in the tank at
                return.
              </p>
            </section>

            {/* 10. Cancellation & Refund */}
            <section className="mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                10. Cancellation & Refund Policy
              </h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                Cancellation requests can be made through the website or app:
              </p>
              <ul className="list-disc list-outside ml-6 space-y-1 text-gray-700 mb-3">
                <li>
                  <strong>Free Cancellation:</strong> Up to 24 hours before pickup time.
                </li>
                <li>
                  <strong>50% Refund:</strong> 12–24 hours before pickup time.
                </li>
                <li>
                  <strong>No Refund:</strong> Less than 12 hours before pickup, or no-show.
                </li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-2">
                <strong>Refund Processing:</strong> Approved refunds will be processed within 5–7
                business days to the original payment method.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Bookings not picked up within 1 hour of the scheduled time will be automatically
                cancelled without refund.
              </p>
            </section>

            {/* 11. Vehicle Damage & Security */}
            <section className="mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                11. Vehicle Damage & Security
              </h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                The rider is responsible for the vehicle's safety during the rental period.
              </p>

              <h3 className="font-semibold text-gray-900 mt-4 mb-1">Rider Responsibilities</h3>
              <ul className="list-disc list-outside ml-6 space-y-1 text-gray-700">
                <li>Inspect vehicle for damages before accepting.</li>
                <li>Report any damages immediately with photographic evidence.</li>
                <li>Liable for any damage, loss, or theft during the rental period.</li>
                <li>Responsible for parking fines and traffic violations.</li>
              </ul>

              <h3 className="font-semibold text-gray-900 mt-4 mb-1">Accident / Collision</h3>
              <ul className="list-disc list-outside ml-6 space-y-1 text-gray-700">
                <li>Inform Scootyonrent and the police immediately.</li>
                <li>Rider is accountable for repair costs.</li>
                <li>Insurance liability beyond ₹10,000.</li>
                <li>Vehicle downtime charges apply until repaired.</li>
              </ul>

              <h3 className="font-semibold text-gray-900 mt-4 mb-1">Lost Keys</h3>
              <p className="text-gray-700 leading-relaxed">
                ₹1,150 for a new lockset + ₹50 transportation charges.
              </p>
            </section>

            {/* 12. Helmet Policy */}
            <section className="mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                12. Helmet Policy
              </h2>
              <ul className="list-disc list-outside ml-6 space-y-1 text-gray-700">
                <li>One helmet provided free with each booking.</li>
                <li>Additional helmets: ₹50 per helmet.</li>
                <li>Lost or damaged helmet: ₹450 charge.</li>
                <li>Helmets must be returned in good condition.</li>
              </ul>
            </section>

            {/* 13. Operating Hours */}
            <section className="mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                13. Operating Hours
              </h2>
              <p className="text-gray-700 leading-relaxed mb-2">
                <strong>Pickup / Drop centres:</strong> 9:00 AM – 8:00 PM (all days).
              </p>
              <p className="text-gray-700 leading-relaxed">
                Vehicle returns after 8:00 PM are not accepted. Late returns must be completed by
                9:00 AM the next morning with applicable penalties.
              </p>
            </section>

            {/* 14. Assumption of Risk */}
            <section className="mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                14. Assumption of Risk
              </h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                By accepting these terms, the rider acknowledges and accepts:
              </p>
              <ul className="list-disc list-outside ml-6 space-y-1 text-gray-700">
                <li>Operating a two-wheeler involves inherent risks.</li>
                <li>Serious injury or death may result from accidents.</li>
                <li>Rider voluntarily assumes all risks associated with vehicle operation.</li>
                <li>Rider is responsible for examining vehicle condition before use.</li>
                <li>Rider agrees to operate the vehicle safely and within legal limits.</li>
              </ul>
            </section>

            {/* 15. Liability Disclaimer */}
            <section className="mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                15. Liability Disclaimer
              </h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                Scootyonrent shall not be liable for:
              </p>
              <ul className="list-disc list-outside ml-6 space-y-1 text-gray-700">
                <li>Personal injury or death resulting from vehicle operation.</li>
                <li>Loss or damage to personal belongings.</li>
                <li>Indirect, consequential, or incidental damages.</li>
                <li>
                  Losses due to vehicle breakdown or mechanical failure (assistance is provided).
                </li>
              </ul>
            </section>

            {/* 16. Amendments */}
            <section className="mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                16. Amendments to Terms
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Scootyonrent reserves the right to modify these terms at any time. Continued use of
                services after modifications constitutes acceptance of the updated terms. Users will
                be notified of significant changes via email or website notification.
              </p>
            </section>

            {/* Contact */}
            <section className="mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Contact Us</h2>
              <ul className="text-gray-700 space-y-1">
                <li><strong>Company:</strong> scootyonrent</li>
                <li>
                  <strong>Email:</strong>{' '}
                  <a
                    href="mailto:support@scootyonrent.com"
                    className="text-primary-600 hover:underline"
                  >
                    support@scootyonrent.com
                  </a>
                </li>
                <li><strong>Phone:</strong> +91 9983391137</li>
                <li><strong>Address:</strong> Udaipur, Rajasthan, India</li>
                <li><strong>Customer Support Hours:</strong> 9:00 AM – 8:00 PM (all days)</li>
              </ul>
            </section>

            {/* Agreement Notice */}
            <p className="text-sm text-gray-600 leading-relaxed border-t border-gray-200 pt-6">
              By clicking "Book Now" or using our services, you acknowledge that you have read,
              understood, and agree to be bound by these Terms & Conditions.
            </p>
          </article>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
