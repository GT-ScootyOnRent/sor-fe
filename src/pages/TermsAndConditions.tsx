import React from 'react';
import { ArrowLeft, Shield, AlertTriangle, FileText, Clock, MapPin } from 'lucide-react';
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

        <div className="container mx-auto px-4 py-8 max-w-5xl">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-primary-500 hover:text-primary-600 mb-6 transition"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>

          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-xl p-8 mb-8">
            <div className="flex items-center mb-4">
              <FileText className="w-10 h-10 mr-4" />
              <h1 className="text-4xl font-bold">Terms & Conditions</h1>
            </div>
            <p className="text-primary-100">
              Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <p className="mt-2 text-primary-100">
              Please read these terms and conditions carefully before using scootyonrent service.
            </p>
          </div>

          {/* Content */}
          <div className="bg-white rounded-xl shadow-lg p-8 space-y-8">
            {/* 1. Acceptance of Terms */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Shield className="w-6 h-6 mr-2 text-primary-600" />
                1. Acceptance of Terms
              </h2>
              <p className="text-gray-700 leading-relaxed">
                By accessing and using scootyonrent services, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            {/* 2. Booking Process */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Clock className="w-6 h-6 mr-2 text-primary-600" />
                2. Booking Process
              </h2>
              <div className="space-y-3 text-gray-700">
                <p className="leading-relaxed">
                  All bookings must be made through our website or mobile application. Offline booking requests will not be entertained under any circumstances.
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Minimum booking duration is 4 hours</li>
                  <li>Bookings can be made online through our platform only</li>
                  <li>Confirmation will be sent via email/SMS after successful payment</li>
                  <li>Booking reference number must be presented at pickup</li>
                </ul>
              </div>
            </section>

            {/* 3. Payment Process */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Payment Process</h2>
              <div className="space-y-3 text-gray-700">
                <p className="leading-relaxed">
                  Rental charges must be paid in advance through our secure payment gateway (Razorpay). We accept:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Credit/Debit Cards</li>
                  <li>UPI (Google Pay, PhonePe, Paytm, etc.)</li>
                  <li>Net Banking</li>
                  <li>Digital Wallets</li>
                </ul>
                <p className="text-sm text-primary-600 bg-primary-50 p-3 rounded-lg mt-4">
                  <strong>Security Deposit:</strong> A refundable security deposit of ₹2,000 will be collected at the time of vehicle pickup.
                </p>
              </div>
            </section>

            {/* 4. Required Documents */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <FileText className="w-6 h-6 mr-2 text-primary-600" />
                4. Required Documents
              </h2>
              <div className="space-y-4 text-gray-700">
                <p className="leading-relaxed">At the time of vehicle pickup, riders must carry:</p>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                  <ul className="space-y-2">
                    <li><strong>✓ Valid Permanent Driving License:</strong> Two-wheeler driving license with chip (Learning licenses NOT accepted)</li>
                    <li><strong>✓ Government-Issued ID:</strong> Aadhaar Card, PAN Card, or Passport</li>
                    <li><strong>✓ Address Proof:</strong> If different from ID, provide utility bill or rent agreement</li>
                    <li><strong>✓ Age Requirement:</strong> Minimum 18 years old</li>
                  </ul>
                </div>
                <p className="text-red-600 text-sm font-medium">
                  <AlertTriangle className="inline w-4 h-4 mr-1" />
                  No refund of booking amount if customer fails to submit original driving license at pickup.
                </p>
              </div>
            </section>

            {/* 5. Delay, Extension & Penalty */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Delay, Extension & Penalty</h2>
              <div className="space-y-3 text-gray-700">
                <p className="leading-relaxed">
                  Customers are requested to avoid any delays to help us fulfill delivery commitments for subsequent bookings.
                </p>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
                  <p><strong>Extension:</strong> Bookings can be extended before completion through the app/website</p>
                  <p><strong>Late Return Penalty:</strong> ₹{100} per hour for delays without extension</p>
                  <p><strong>Maximum Grace Period:</strong> 15 minutes without penalty</p>
                </div>
                <p className="text-sm text-gray-600">
                  Delays in drop-off will not be waived due to delays in pickup. In such cases, customers must cancel the previous booking and create a new one.
                </p>
              </div>
            </section>

            {/* 6. Traffic Rules & Violations */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <AlertTriangle className="w-6 h-6 mr-2 text-red-600" />
                6. Traffic Rules & Violations
              </h2>
              <div className="space-y-3 text-gray-700">
                <p className="leading-relaxed">
                  All vehicles are equipped with GPS tracking. Riders must follow traffic rules and speed limits set by government regulations.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-gray-300 p-3 text-left">Violation</th>
                        <th className="border border-gray-300 p-3 text-left">Penalty Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 p-3">Exceeding speed limit</td>
                        <td className="border border-gray-300 p-3 font-semibold text-red-600">₹1,000</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-3">Riding with more than 2 persons</td>
                        <td className="border border-gray-300 p-3 font-semibold text-red-600">₹1,000</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-3">Drink and drive</td>
                        <td className="border border-gray-300 p-3 font-semibold text-red-600">₹10,000</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-3">Jumping red light</td>
                        <td className="border border-gray-300 p-3 font-semibold text-red-600">₹1,000 - ₹5,000</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-3">Vehicle impounded by authorities</td>
                        <td className="border border-gray-300 p-3 font-semibold text-red-600">₹1,500 + legal charges</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* 7. Geographic Restrictions */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <MapPin className="w-6 h-6 mr-2 text-primary-600" />
                  7. Geographic Restrictions
                </h2>

                <div className="space-y-4 text-gray-700">

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                    <p>
                      <strong>1. City Limits Only:</strong> All rented vehicles must remain
                      within the city limits of the pickup location throughout the rental
                      period.
                    </p>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
                    <p>
                      <strong>2. No Intercity Travel:</strong> Taking the vehicle outside the
                      designated city boundaries is strictly prohibited without prior written
                      approval from Scootyonrent.
                    </p>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                    <p className="mb-3">
                      <strong>3. Violation Consequences:</strong>
                    </p>

                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Immediate termination of the rental agreement</li>
                      <li>
                        Full liability for any damages, accidents, or incidents occurring
                        outside city limits
                      </li>
                      <li>Additional penalty charges as determined by Scootyonrent</li>
                      <li>Forfeiture of security deposit</li>
                      <li>Legal action may be taken if necessary</li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                    <p>
                      <strong>4. Tracking:</strong> Vehicles may be equipped with GPS
                      tracking devices to monitor location. Any detected violation of
                      geographic restrictions will result in immediate action.
                    </p>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                    <p>
                      <strong>5. Emergency Exception:</strong> In case of a genuine emergency
                      requiring travel outside city limits, the renter must immediately
                      contact Scootyonrent support for approval before proceeding.
                    </p>
                  </div>

                </div>
              </section>

            {/* 8. Prohibited Uses */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Prohibited Uses</h2>
              <div className="space-y-3 text-gray-700">
                <p className="leading-relaxed">The following uses are strictly prohibited:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Use for rallies, competitions, or professional events</li>
                  <li>Commercial use without prior written permission</li>
                  <li>Operation under influence of alcohol, drugs, or impairing medication</li>
                  <li>Use in any criminal or illegal activity</li>
                  <li>Subleasing or transferring the vehicle to third parties</li>
                  <li>Off-road or stunt riding</li>
                </ul>
              </div>
            </section>

            {/* 9. Fuel Policy */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Fuel Policy</h2>
              <div className="space-y-3 text-gray-700">
                <p className="leading-relaxed">
                  Fuel is the responsibility of the customer. The vehicle will be provided with sufficient fuel to reach the nearest fuel station.
                </p>
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                  <ul className="space-y-2">
                    <li><strong>Pickup:</strong> Vehicle provided with fuel to reach nearest pump</li>
                    <li><strong>Return:</strong> Vehicle must be returned with enough fuel for next customer (minimum to reach pump)</li>
                    <li><strong>Insufficient Fuel at Return:</strong> ₹30 will be charged</li>
                  </ul>
                </div>
                <p className="text-sm text-gray-600">
                  We do not have facilities to siphon extra fuel or purchase fuel left in the tank at return.
                </p>
              </div>
            </section>

            {/* 10. Cancellation & Refund */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Cancellation & Refund Policy</h2>
              <div className="space-y-3 text-gray-700">
                <p className="leading-relaxed">Cancellation requests can be made through the website/app:</p>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                  <div>
                    <p className="font-semibold text-green-600">✓ Free Cancellation</p>
                    <p className="text-sm">Up to 24 hours before pickup time</p>
                  </div>
                  <div>
                    <p className="font-semibold text-yellow-600">⚠ 50% Refund</p>
                    <p className="text-sm">12-24 hours before pickup time</p>
                  </div>
                  <div>
                    <p className="font-semibold text-red-600">✗ No Refund</p>
                    <p className="text-sm">Less than 12 hours before pickup or no-show</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  <strong>Refund Processing:</strong> Approved refunds will be processed within 5-7 business days to the original payment method.
                </p>
                <p className="text-sm text-red-600">
                  Bookings not picked up within 1 hour of scheduled time will be automatically cancelled without refund.
                </p>
              </div>
            </section>

            {/* 11. Vehicle Damage & Security */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Vehicle Damage & Security</h2>
              <div className="space-y-3 text-gray-700">
                <p className="leading-relaxed">
                  The rider is responsible for the vehicle's safety during the rental period.
                </p>
                <div className="space-y-4">
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                    <p className="font-semibold mb-2">Rider Responsibilities:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Inspect vehicle for damages before accepting</li>
                      <li>Report any damages immediately with photographic evidence</li>
                      <li>Liable for any damage, loss, or theft during rental period</li>
                      <li>Responsible for parking fines and traffic violations</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold mb-2">Accident/Collision:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Inform scootyonrent and police immediately</li>
                      <li>Rider accountable for repair costs</li>
                      <li>Insurance liability beyond ₹10,000</li>
                      <li>Vehicle downtime charges apply until repaired</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold mb-2">Lost Keys:</p>
                    <p className="text-sm">₹1,150 for new lockset + ₹50 transportation charges</p>
                  </div>
                </div>
              </div>
            </section>

            {/* 12. Helmet Policy */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Helmet Policy</h2>
              <div className="space-y-3 text-gray-700">
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>One helmet provided free with each booking</li>
                  <li>Additional helmets: ₹50 per helmet</li>
                  <li>Lost/damaged helmet: ₹450 charge</li>
                  <li>Helmets must be returned in good condition</li>
                </ul>
              </div>
            </section>

            {/* 13. Operating Hours */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Operating Hours</h2>
              <div className="space-y-3 text-gray-700">
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                  <p className="font-semibold mb-2">Pickup/Drop Centers Operating Hours:</p>
                  <p className="text-lg">9:00 AM - 8:00 PM (All Days)</p>
                </div>
                <p className="text-sm text-gray-600">
                  Vehicle returns after 8:00 PM are not accepted. Late returns must be completed by 9:00 AM the next morning with applicable penalties.
                </p>
              </div>
            </section>

            {/* 14. Assumption of Risk */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Assumption of Risk</h2>
              <div className="space-y-3 text-gray-700">
                <p className="leading-relaxed">
                  By accepting these terms, the rider acknowledges and accepts:
                </p>
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                  <ul className="space-y-2 text-sm">
                    <li>• Operating a two-wheeler involves inherent risks</li>
                    <li>• Serious injury or death may result from accidents</li>
                    <li>• Rider voluntarily assumes all risks associated with vehicle operation</li>
                    <li>• Rider is responsible for examining vehicle condition before use</li>
                    <li>• Rider agrees to operate vehicle safely and within legal limits</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 15. Liability Disclaimer */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Liability Disclaimer</h2>
              <div className="space-y-3 text-gray-700">
                <p className="leading-relaxed">
                  scootyonrent shall not be liable for:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Personal injury or death resulting from vehicle operation</li>
                  <li>Loss or damage to personal belongings</li>
                  <li>Indirect, consequential, or incidental damages</li>
                  <li>Losses due to vehicle breakdown or mechanical failure (assistance provided)</li>
                </ul>
              </div>
            </section>

            {/* 16. Amendments */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">16. Amendments to Terms</h2>
              <div className="space-y-3 text-gray-700">
                <p className="leading-relaxed">
                  scootyonrent reserves the right to modify these terms at any time. Continued use of services after modifications constitutes acceptance of updated terms. Users will be notified of significant changes via email or website notification.
                </p>
              </div>
            </section>

            {/* Contact Information */}
            <section className="bg-gradient-to-r from-primary-50 to-indigo-50 border border-primary-200 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
              <div className="space-y-2 text-gray-700">
                <p><strong>Company:</strong> scootyonrent</p>
                <p><strong>Email:</strong> support@scootyonrent.com</p>
                <p><strong>Phone:</strong> +91 9983391137</p>
                <p><strong>Address:</strong> Udaipur, Rajasthan, India</p>
                <p><strong>Customer Support Hours:</strong> 9:00 AM - 8:00 PM (All Days)</p>
              </div>
            </section>

            {/* Agreement Notice */}
            <div className="bg-gray-800 text-white rounded-xl p-6 text-center">
              <p className="text-sm">
                By clicking "Book Now" or using our services, you acknowledge that you have read, understood, and agree to be bound by these Terms & Conditions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
