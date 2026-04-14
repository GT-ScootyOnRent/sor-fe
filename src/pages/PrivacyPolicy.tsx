import React from 'react';
import { ArrowLeft, Shield, Lock, Eye, Database, Globe, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackgroundSlideshow from '../components/BackgroundSlideshow';

const PrivacyPolicy: React.FC = () => {
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
          <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl p-8 mb-8">
            <div className="flex items-center mb-4">
              <Lock className="w-10 h-10 mr-4" />
              <h1 className="text-4xl font-bold">Privacy Policy</h1>
            </div>
            <p className="text-green-100">
              Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <p className="mt-2 text-green-100">
              This Privacy Policy describes how scootyonrent collects, uses, and protects your personal information.
            </p>
          </div>

          {/* Content */}
          <div className="bg-white rounded-xl shadow-lg p-8 space-y-8">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Shield className="w-6 h-6 mr-2 text-green-600" />
                Introduction
              </h2>
              <p className="text-gray-700 leading-relaxed">
                At scootyonrent, we are committed to protecting your privacy and personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services. By using our Service, you agree to the collection and use of information in accordance with this policy.
              </p>
            </section>

            {/* Definitions */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Interpretation and Definitions</h2>
              <div className="space-y-4 text-gray-700">
                <h3 className="text-lg font-semibold text-gray-800">Definitions</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3 text-sm">
                  <p><strong>Account:</strong> A unique account created for you to access our Service or parts of our Service.</p>
                  <p><strong>Company:</strong> Refers to scootyonrent, Udaipur, Rajaathan, India.</p>
                  <p><strong>Cookies:</strong> Small files placed on your device containing browsing history details.</p>
                  <p><strong>Country:</strong> Refers to Gujarat, India.</p>
                  <p><strong>Device:</strong> Any device that can access the Service (computer, phone, tablet).</p>
                  <p><strong>Personal Data:</strong> Any information relating to an identified or identifiable individual.</p>
                  <p><strong>Service:</strong> Refers to the scootyonrent website and mobile application.</p>
                  <p><strong>Usage Data:</strong> Data collected automatically through use of the Service.</p>
                  <p><strong>Website:</strong> Refers to scootyonrent, accessible from https://scootyonrent.com</p>
                </div>
              </div>
            </section>
            {/* Challan / Traffic Fine Policy */}
                <section className="mb-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="text-2xl">🚦</span> Traffic Challan & Fine Policy
                  </h2>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 space-y-3">
                    <p className="text-gray-700 leading-relaxed">
                      Any traffic challan or fine issued by the <strong>RTO (Regional Transport Office)</strong> or
                      <strong> Traffic Police</strong> during the rental period is the sole responsibility of the customer.
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                      If an online challan is received and the customer has not cleared it independently,
                      <strong> ScootyOnRent will process the challan payment on the customer's behalf</strong> and
                      charge an additional <strong className="text-red-600">10% processing fee</strong> on the
                      total challan amount for this service.
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                      Customers are advised to check and clear any pending challans promptly to avoid
                      the additional processing charge.
                    </p>
                    <div className="bg-yellow-100 border border-yellow-300 rounded-lg px-4 py-3 mt-2">
                      <p className="text-sm text-yellow-800 font-medium">
                        ⚠️ उदाहरण: यदि चालान ₹500 का है और ScootyOnRent द्वारा जमा कराया जाता है,
                        तो कुल देय राशि ₹500 + ₹50 (10% processing fee) = <strong>₹550</strong> होगी।
                      </p>
                    </div>
                  </div>
                </section>

            {/* Data Collection */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Database className="w-6 h-6 mr-2 text-green-600" />
                Collecting and Using Your Personal Data
              </h2>
              
              <div className="space-y-6">
                {/* Personal Data */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Types of Data Collected</h3>
                  
                  <h4 className="font-semibold text-gray-800 mb-2">Personal Data</h4>
                  <p className="text-gray-700 mb-3">
                    While using our Service, we may ask you to provide certain personally identifiable information that can be used to contact or identify you. This may include, but is not limited to:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4 text-gray-700">
                    <li>First name and last name</li>
                    <li>Email address</li>
                    <li>Phone number</li>
                    <li>Address, State, Province, ZIP/Postal code, City</li>
                    <li>Driving License details</li>
                    <li>Government-issued ID (Aadhaar, PAN, Passport)</li>
                    <li>Date of birth</li>
                    <li>Payment information (processed securely via Razorpay)</li>
                  </ul>
                </div>

                {/* Usage Data */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Usage Data</h4>
                  <p className="text-gray-700 mb-3">
                    Usage Data is collected automatically when using the Service. This may include:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4 text-gray-700">
                    <li>Your Device's Internet Protocol address (IP address)</li>
                    <li>Browser type and version</li>
                    <li>Pages visited on our Service</li>
                    <li>Time and date of visit</li>
                    <li>Time spent on pages</li>
                    <li>Unique device identifiers</li>
                    <li>Mobile device information (device type, unique ID, mobile OS)</li>
                    <li>GPS location data (with permission for vehicle tracking)</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Tracking Technologies */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Eye className="w-6 h-6 mr-2 text-green-600" />
                Tracking Technologies and Cookies
              </h2>
              <div className="space-y-4 text-gray-700">
                <p className="leading-relaxed">
                  We use Cookies and similar tracking technologies to track activity on our Service and store certain information. Technologies used include:
                </p>
                
                <div className="space-y-4">
                  {/* Cookies Types */}
                  <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-2">Types of Cookies We Use:</h4>
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="font-semibold text-primary-700">Necessary / Essential Cookies</p>
                        <p>Type: Session Cookies</p>
                        <p>Purpose: Essential for providing services and enabling features. Required for authentication and fraud prevention.</p>
                      </div>
                      <div>
                        <p className="font-semibold text-primary-700">Cookies Policy / Notice Acceptance Cookies</p>
                        <p>Type: Persistent Cookies</p>
                        <p>Purpose: Identify if users have accepted cookie usage on the website.</p>
                      </div>
                      <div>
                        <p className="font-semibold text-primary-700">Functionality Cookies</p>
                        <p>Type: Persistent Cookies</p>
                        <p>Purpose: Remember choices you make (login details, language preference) for a more personalized experience.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                    <p className="text-sm">
                      <strong>Managing Cookies:</strong> You can instruct your browser to refuse all Cookies or indicate when a Cookie is being sent. However, if you do not accept Cookies, you may not be able to use some parts of our Service.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Use of Personal Data */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Users className="w-6 h-6 mr-2 text-green-600" />
                Use of Your Personal Data
              </h2>
              <div className="space-y-3 text-gray-700">
                <p className="leading-relaxed">
                  The Company may use Personal Data for the following purposes:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>To provide and maintain our Service:</strong> Including monitoring usage of our Service</li>
                  <li><strong>To manage your Account:</strong> Manage your registration and access to Service functionalities</li>
                  <li><strong>For contract performance:</strong> Development and undertaking of booking contracts for vehicle rentals</li>
                  <li><strong>To contact you:</strong> Via email, SMS, phone, or app notifications regarding bookings, updates, and service information</li>
                  <li><strong>To provide offers:</strong> Inform you about special offers, new vehicles, and promotions (opt-out available)</li>
                  <li><strong>To manage requests:</strong> Attend and manage your support requests</li>
                  <li><strong>For business transfers:</strong> Evaluate or conduct mergers, restructuring, or asset transfers</li>
                  <li><strong>For analytics:</strong> Data analysis, usage trends, promotional campaign effectiveness, and service improvement</li>
                  <li><strong>For safety and security:</strong> GPS tracking during rentals for vehicle security and customer safety</li>
                  <li><strong>For legal compliance:</strong> Comply with legal obligations and enforce our agreements</li>
                </ul>
              </div>
            </section>

            {/* Sharing Personal Data */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Sharing Your Personal Information</h2>
              <div className="space-y-3 text-gray-700">
                <p className="leading-relaxed">
                  We may share your personal information in the following situations:
                </p>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3 text-sm">
                  <p><strong>With Service Providers:</strong> To monitor and analyze Service usage, payment processing (Razorpay), SMS/email delivery, and customer support.</p>
                  <p><strong>For business transfers:</strong> During negotiations or execution of merger, sale, financing, or acquisition.</p>
                  <p><strong>With Affiliates:</strong> Our parent company and subsidiaries, who will honor this Privacy Policy.</p>
                  <p><strong>With business partners:</strong> To offer certain products, services, or promotions.</p>
                  <p><strong>With your consent:</strong> For any other purpose with your explicit consent.</p>
                  <p><strong>Legal requirements:</strong> When required by law or to respond to valid legal requests.</p>
                </div>
                <div className="bg-primary-50 border-l-4 border-primary-400 p-4 rounded">
                  <p className="text-sm">
                    <strong>We do NOT:</strong> Sell, rent, or trade your personal information to third parties for marketing purposes.
                  </p>
                </div>
              </div>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Retention of Your Personal Data</h2>
              <div className="space-y-3 text-gray-700">
                <p className="leading-relaxed">
                  The Company will retain your Personal Data only for as long as necessary for the purposes set out in this Privacy Policy:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>We retain data to comply with legal obligations</li>
                  <li>To resolve disputes and enforce agreements</li>
                  <li>Usage Data is generally retained for shorter periods unless used for security or service improvement</li>
                  <li>Account data retained while account is active, plus legal retention period post-closure</li>
                </ul>
              </div>
            </section>

            {/* Data Transfer */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Globe className="w-6 h-6 mr-2 text-green-600" />
                Transfer of Your Personal Data
              </h2>
              <div className="space-y-3 text-gray-700">
                <p className="leading-relaxed">
                  Your information, including Personal Data, is processed at the Company's operating offices in India. Your consent to this Privacy Policy followed by submission of such information represents your agreement to that transfer.
                </p>
                <p className="leading-relaxed">
                  The Company will take all steps reasonably necessary to ensure that your data is treated securely and in accordance with this Privacy Policy.
                </p>
              </div>
            </section>

            {/* Delete Personal Data */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Delete Your Personal Data</h2>
              <div className="space-y-3 text-gray-700">
                <p className="leading-relaxed">
                  You have the right to delete or request assistance in deleting Personal Data we have collected about you.
                </p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="font-semibold mb-2">You may:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Update, amend, or delete your information through your Account settings</li>
                    <li>Contact us to request access, correction, or deletion of personal information</li>
                    <li>Opt-out of marketing communications at any time</li>
                  </ul>
                </div>
                <p className="text-sm text-gray-600">
                  Note: We may retain certain information when we have a legal obligation or lawful basis to do so (e.g., pending bookings, legal disputes, compliance requirements).
                </p>
              </div>
            </section>

            {/* Disclosure */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Disclosure of Your Personal Data</h2>
              
              <div className="space-y-4 text-gray-700">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Business Transactions</h3>
                  <p className="text-sm">
                    If the Company is involved in merger, acquisition, or asset sale, your Personal Data may be transferred. We will provide notice before transfer and application of a different Privacy Policy.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Law Enforcement</h3>
                  <p className="text-sm">
                    We may disclose Personal Data if required by law or in response to valid requests by public authorities (court or government agency).
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Other Legal Requirements</h3>
                  <p className="text-sm mb-2">The Company may disclose Personal Data in good faith belief that such action is necessary to:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                    <li>Comply with a legal obligation</li>
                    <li>Protect and defend the rights or property of the Company</li>
                    <li>Prevent or investigate possible wrongdoing</li>
                    <li>Protect personal safety of users or the public</li>
                    <li>Protect against legal liability</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Security */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Lock className="w-6 h-6 mr-2 text-green-600" />
                Security of Your Personal Data
              </h2>
              <div className="space-y-3 text-gray-700">
                <p className="leading-relaxed">
                  The security of your Personal Data is important to us. We use commercially acceptable means to protect your data including:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>SSL/TLS encryption for data transmission</li>
                  <li>Secure payment processing via Razorpay (PCI DSS compliant)</li>
                  <li>Encrypted storage of sensitive information</li>
                  <li>Access controls and authentication mechanisms</li>
                  <li>Regular security audits and updates</li>
                </ul>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded mt-4">
                  <p className="text-sm">
                    <strong>Important:</strong> No method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.
                  </p>
                </div>
              </div>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Children's Privacy</h2>
              <div className="space-y-3 text-gray-700">
                <p className="leading-relaxed">
                  Our Service is not intended for anyone under the age of 18. We do not knowingly collect personally identifiable information from anyone under 18. If you are a parent or guardian and become aware that your child has provided us with Personal Data, please contact us.
                </p>
                <p className="text-sm text-red-600">
                  If we become aware that we have collected Personal Data from anyone under 18 without verification of parental consent, we take steps to remove that information from our servers.
                </p>
              </div>
            </section>

            {/* Links to Other Websites */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Links to Other Websites</h2>
              <div className="space-y-3 text-gray-700">
                <p className="leading-relaxed">
                  Our Service may contain links to third-party websites (payment gateways, social media). We strongly advise you to review the Privacy Policy of every site you visit.
                </p>
                <p className="text-sm">
                  We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party sites or services.
                </p>
              </div>
            </section>

            {/* Changes to Privacy Policy */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to this Privacy Policy</h2>
              <div className="space-y-3 text-gray-700">
                <p className="leading-relaxed">
                  We may update our Privacy Policy from time to time. We will notify you of any changes by:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Posting the new Privacy Policy on this page</li>
                  <li>Updating the "Last updated" date</li>
                  <li>Sending an email notification for significant changes</li>
                  <li>Displaying a prominent notice on our Service</li>
                </ul>
                <p className="text-sm text-primary-600">
                  You are advised to review this Privacy Policy periodically for any changes. Changes are effective when posted on this page.
                </p>
              </div>
            </section>

            {/* Your Rights */}
            <section className="bg-primary-50 border border-primary-200 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Data Protection Rights</h2>
              <div className="space-y-2 text-gray-700 text-sm">
                <p><strong>Right to Access:</strong> Request copies of your personal data</p>
                <p><strong>Right to Rectification:</strong> Request correction of inaccurate information</p>
                <p><strong>Right to Erasure:</strong> Request deletion of your personal data (subject to legal retention requirements)</p>
                <p><strong>Right to Restrict Processing:</strong> Request restriction of processing your personal data</p>
                <p><strong>Right to Data Portability:</strong> Request transfer of data to another organization</p>
                <p><strong>Right to Object:</strong> Object to processing of your personal data</p>
              </div>
            </section>

            {/* Contact Information */}
            <section className="bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about this Privacy Policy, please contact us:
              </p>
              <div className="space-y-2 text-gray-700">
                <p><strong>Company:</strong> scootyonrent</p>
                <p><strong>Email:</strong> privacy@scootyonrent.com</p>
                <p><strong>Support Email:</strong> support@scootyonrent.com</p>
                <p><strong>Phone:</strong> +91 9983391137</p>
                <p><strong>Address:</strong> Udaipur, Rajasthan, India</p>
                <p><strong>Response Time:</strong> We respond to privacy inquiries within 48 hours</p>
              </div>
            </section>

            {/* Agreement Notice */}
            <div className="bg-gray-800 text-white rounded-xl p-6 text-center">
              <p className="text-sm">
                By using scootyonrent services, you acknowledge that you have read and understood this Privacy Policy and consent to the collection, use, and disclosure of your personal information as described herein.
              </p>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default PrivacyPolicy;
