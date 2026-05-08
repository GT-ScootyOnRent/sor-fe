import { Link , useLocation} from 'react-router-dom';
import { Facebook, Instagram, Twitter, MapPin } from 'lucide-react';
import { useAppSelector } from '../store/hooks';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
   const location = useLocation();

  // Footer is hidden until the user logs in
  if (!isAuthenticated) return null;
  if (location.pathname === '/login') {
    return null;
  }

  return (
    <footer className="bg-black text-white w-full">
      <div className="container mx-auto px-4 py-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Company Info */}
<div>
  <h3 className="text-xl md:text-2xl mb-1">
    Scooty<span className="text-primary-500">onrent</span>
  </h3>

  <p className="text-gray-400 text-sm md:text-base leading-snug mb-3">
    Your trusted partner for two-wheeler rentals across India.
  </p>

  {/* Social Media Icons */}
  <div className="flex items-center gap-3">
    <a
      href="#"
      className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary-500 transition-colors"
    >
      <Facebook className="w-5 h-5" />
    </a>

    <a
      href="#"
      className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary-500 transition-colors"
    >
      <Instagram className="w-5 h-5" />
    </a>

    <a
      href="#"
      className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary-500 transition-colors"
    >
      <Twitter className="w-5 h-5" />
    </a>
  </div>
</div>
          {/* Quick Links */}
          <div>
            <h4 className="text-base md:text-lg font-semibold mb-1">Quick Links</h4>
            <ul className="space-y-1 text-gray-400 text-sm md:text-base">
              <li>
                <Link to="/about-us" className="hover:text-primary-500 transition-colors">
                  About Us
                </Link>
              </li>
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
            </ul>
          </div>

          {/* Cities & Social Media */}
          <div>
            <h4 className="text-base md:text-lg font-semibold mb-1">Our Locations</h4>
            <ul className="space-y-1 text-gray-400 text-sm md:text-base mb-2">
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary-500" />
                Udaipur
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary-500" />
                Jaipur (Launching Soon)
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary-500" />
                Jodhpur (Launching Soon)
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-3 pt-3 text-center text-gray-400 space-y-1">
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
