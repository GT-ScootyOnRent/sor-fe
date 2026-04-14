import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { User, LogOut, MapPin, ChevronDown } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { logout } from '../store/slices/authSlice';
import { openCityModal } from '../store/slices/citySlice';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const selectedCity = useAppSelector((state) => state.city.selectedCity);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleHomeClick = (e: React.MouseEvent) => {
    if (location.pathname === '/') {
      e.preventDefault();
      scrollToTop();
    }
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location.pathname === '/') {
      scrollToTop();
    } else {
      navigate('/');
    }
  };

  const handleVehiclesClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/vehicles');
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo & City Selector */}
          <div className="flex-1 flex items-center gap-4">
            <a
              href="/"
              onClick={handleLogoClick}
              className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
            >
              <h1 className="text-2xl tracking-tight text-black font-bold">
                Scooty<span className="text-primary-500">onrent</span>
              </h1>
            </a>
            {/* City Selector */}
            {selectedCity && (
              <button
                onClick={() => dispatch(openCityModal())}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all text-sm"
              >
                <MapPin className="w-4 h-4 text-primary-500" />
                <span className="font-medium text-gray-700">{selectedCity.name}</span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>
            )}
          </div>

          {/* Navigation - Centered */}
          <nav className="hidden md:flex items-center gap-8 flex-1 justify-center">
            <Link
              to="/"
              onClick={handleHomeClick}
              className="text-black hover:text-primary-500 transition-colors font-medium"
            >
              Home
            </Link>
            <a
              href="/vehicles"
              onClick={handleVehiclesClick}
              className="text-black hover:text-primary-500 transition-colors font-medium cursor-pointer"
            >
              Vehicles
            </a>
            <Link
              to="/contact"
              className="text-black hover:text-primary-500 transition-colors font-medium"
            >
              Contact Us
            </Link>
          </nav>

          {/* Login/Profile/Logout Buttons */}
          <div className="flex items-center gap-3 flex-1 justify-end">
            {isAuthenticated ? (
              <>
                <Button
                  onClick={() => navigate('/profile')}
                  variant="outline"
                  className="border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white transition-all"
                >
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </Button>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="border-red-400 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <Button
                onClick={() => navigate('/login')}
                className="bg-primary-500 hover:bg-primary-600 text-white transition-all"
              >
                Login
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
