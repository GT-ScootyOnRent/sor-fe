import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, MapPin } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black text-white mt-20">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Company Info */}
          <div>
            <h3 className="text-2xl md:text-3xl mb-5">
              Scooty<span className="text-primary-500">onrent</span>
            </h3>
            <p className="text-gray-400 text-base md:text-lg leading-relaxed">
              Your trusted partner for two-wheeler rentals across India.
            </p>
            {/* <p className="text-gray-400 mt-3 text-sm">
              Plot No. 28, Singh Nagar, Kuchaman City Charanwas, Kuchaman City, Nagaur, Rajasthan, 341508
            </p> */}
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg md:text-xl font-semibold mb-5">Quick Links</h4>
            <ul className="space-y-3 text-gray-400 text-base md:text-lg">
              <li>
                <Link to="/privacy-policy" className="hover:text-primary-500 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-primary-500 transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-primary-500 transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Cities & Social Media */}
          <div>
            <h4 className="text-lg md:text-xl font-semibold mb-5">Our Locations</h4>
            <ul className="space-y-3 text-gray-400 text-base md:text-lg mb-7">
              <li className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary-500" />
                Udaipur
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary-500" />
                Jaipur (Launching Soon)
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary-500" />
                Jodhpur (Launching Soon)
              </li>
            </ul>

            <div className="flex gap-4">
              <a
                href="#"
                className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary-500 transition-colors"
              >
                <Facebook className="w-6 h-6" />
              </a>
              <a
                href="#"
                className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary-500 transition-colors"
              >
                <Instagram className="w-6 h-6" />
              </a>
              <a
                href="#"
                className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary-500 transition-colors"
              >
                <Twitter className="w-6 h-6" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 space-y-2">
          <p>&copy; {currentYear} scootyonrent. All rights reserved.</p>
          <p className="text-xs text-gray-500">
            This site is protected by reCAPTCHA and the Google{' '}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary-500 transition-colors"
            >
              Privacy Policy
            </a>{' '}
            and{' '}
            <a
              href="https://policies.google.com/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary-500 transition-colors"
            >
              Terms of Service
            </a>{' '}
            apply.
          </p>
        </div>
      </div>
    </footer>
  );
}
