import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import {
  User,
  LogOut,
  MapPin,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { logout } from '../store/slices/authSlice';
import { openCityModal } from '../store/slices/citySlice';
import ContactButton from './ContactButton';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const selectedCity = useAppSelector((state) => state.city.selectedCity);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleVehiclesClick = (
    e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>
  ) => {
    e.preventDefault();
    navigate('/vehicles');
    setMobileMenuOpen(false);
  };

  const handleHomeClick = (e: React.MouseEvent) => {
    if (location.pathname === '/') {
      e.preventDefault();
      scrollToTop();
    }
    setMobileMenuOpen(false);
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location.pathname === '/') {
      scrollToTop();
    } else {
      navigate('/');
    }
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
    setMobileMenuOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;
  const navLinkClass = (path: string) =>
    `relative font-medium pb-1 transition-colors ${
      isActive(path)
        ? 'text-primary-600 after:absolute after:left-0 after:right-0 after:bottom-0 after:h-[3px] after:rounded-full after:bg-primary-500'
        : 'text-black hover:text-primary-500'
    }`;
  const mobileNavLinkClass = (path: string) =>
    `block font-medium pl-3 border-l-4 transition-colors ${
      isActive(path)
        ? 'text-primary-600 border-primary-500'
        : 'text-black border-transparent'
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="container mx-auto px-4 py-2">
        {/* Top Row */}
        <div className="flex items-center justify-between gap-3">
          {/* Left Side */}
          <div className="flex items-center gap-4 min-w-0 py-2">
            <a
              href="/"
              onClick={handleLogoClick}
              className="cursor-pointer shrink-0 flex items-center"
            >
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-black whitespace-nowrap leading-tight">
                Scooty<span className="text-primary-500">onrent</span>
              </h1>
            </a>

            {/* City Selector */}
            {selectedCity && (
              <button
                onClick={() => dispatch(openCityModal())}
                className="flex items-center gap-2 px-3 py-2 md:px-4 rounded-xl border border-primary-200 bg-primary-50 hover:bg-primary-100 transition-all shadow-sm min-h-[42px] max-w-[150px] sm:max-w-none"
              >
                <MapPin className="w-4 h-4 md:w-5 md:h-5 text-primary-500 shrink-0" />
                <span className="truncate text-xs sm:text-sm md:text-base font-semibold text-gray-800">
                  {selectedCity.name}
                </span>
                <ChevronDown className="w-4 h-4 text-primary-500 shrink-0" />
              </button>
            )}
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            <Link
              to="/"
              onClick={handleHomeClick}
              className={navLinkClass('/')}
            >
              Home
            </Link>
           <a
  href="/vehicles"
  onClick={handleVehiclesClick}
  className="
  relative inline-flex items-center justify-center
  px-6 py-2 text-sm font-semibold text-teal-600
  rounded-full bg-white overflow-hidden

  transition-all duration-200 ease-out

  hover:scale-105
  hover:text-teal-700
  hover:shadow-[0_0_0_2px_rgba(20,184,166,0.15)]

  active:scale-95
  active:shadow-[0_0_0_3px_rgba(20,184,166,0.25)_inset]
"
>
  {/* SVG border animation */}
  <svg
    className="absolute inset-0 w-full h-full"
    viewBox="0 0 200 60"
    preserveAspectRatio="none"
  >
    {/* Path around pill */}
    <rect
      x="1"
      y="1"
      width="198"
      height="58"
      rx="30"
      ry="30"
      fill="none"
      stroke="#14b8a6"
      strokeWidth="2"
      strokeDasharray="40 220"   // length of line + gap
      strokeLinecap="round"
    >
      <animate
        attributeName="stroke-dashoffset"
        from="0"
        to="-260"
        dur="3s"
        repeatCount="indefinite"
      />
    </rect>

    {/* Second opposite line */}
    <rect
      x="1"
      y="1"
      width="198"
      height="58"
      rx="30"
      ry="30"
      fill="none"
      stroke="#14b8a6"
      strokeWidth="2"
      strokeDasharray="40 220"
      strokeDashoffset="130"   // EXACT opposite
      strokeLinecap="round"
    >
      <animate
        attributeName="stroke-dashoffset"
        from="130"
        to="-130"
        dur="3s"
        repeatCount="indefinite"
      />
    </rect>
  </svg>

  {/* Inner mask */}
  <span className="absolute inset-[2px] bg-white rounded-full"></span>

  {/* Text */}
  <span className="relative z-10">Booking/Vehicles</span>
</a>

            <Link to="/contact" className={navLinkClass('/contact')}>
              Contact Us
            </Link>

            <Link to="/work-with-us" className={navLinkClass('/work-with-us')}>
              Work With Us
            </Link>
          </nav>

          {/* Desktop Right Side */}
          <div className="hidden md:flex items-center gap-3">
            <ContactButton />
            {isAuthenticated ? (
              <>
                <Button
                  onClick={() => navigate('/profile')}
                  variant="outline"
                  className="border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white"
                >
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </Button>

                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="border-red-400 text-red-500 hover:bg-red-500 hover:text-white"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <Button
                onClick={() => navigate('/login')}
                className="bg-primary-500 hover:bg-primary-600 text-white"
              >
                Login
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg border border-gray-200"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 border-t border-gray-200 pt-4 space-y-3">
            <Link
              to="/"
              onClick={handleHomeClick}
              className={mobileNavLinkClass('/')}
            >
              Home
            </Link>

            <button
              onClick={handleVehiclesClick}
              className={`${mobileNavLinkClass('/vehicles')} w-full text-left`}
            >
              Booking
            </button>

            <Link
              to="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className={mobileNavLinkClass('/contact')}
            >
              Contact Us
            </Link>

            <Link
              to="/work-with-us"
              onClick={() => setMobileMenuOpen(false)}
              className={mobileNavLinkClass('/work-with-us')}
            >
              Work With Us
            </Link>

            <ContactButton className="!w-fit" />


            <div className="pt-2">
              {isAuthenticated ? (
                <div className="space-y-2">
                  <Button
                    onClick={() => {
                      navigate('/profile');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full"
                    variant="outline"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </Button>

                  <Button
                    onClick={handleLogout}
                    className="w-full"
                    variant="outline"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => {
                    navigate('/login');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full bg-primary-500 hover:bg-primary-600 text-white"
                >
                  Login
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
