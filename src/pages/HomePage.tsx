import { Link } from 'react-router-dom';
import VehicleCarousel from '../components/VehicleCarousel';
import Header from '../components/Header';
import Footer from '../components/Footer';
import DateTimePicker from '../components/DateTimePicker';
import FAQSection from '../components/FAQSection';
import RatingsSection from '../components/RatingsSection';

const HomePage: React.FC = () => {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-indigo-50 to-purple-50">
        
        {/* Hero Section */}
        <section
          className="relative pt-20 pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden
                     bg-[linear-gradient(135deg,#ffb87a,#ff7ac8,#7feaff,#80ffbf)]"
        >
          {/* Vertical lines pattern overlay */}
          <div 
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: `repeating-linear-gradient(
                90deg,
                rgba(255, 255, 255, .6) 0px,
                rgba(255, 255, 255, .6) 1px,
                transparent 2px,
                transparent 100px
              )`  
            }}
          />
          
          {/* Content */}
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-12">
              <div className="flex justify-center mb-6">
                <div className="relative inline-block">
                  <span
                    aria-hidden="true"
                    className="absolute left-1/2 -translate-x-1/2 w-6 h-3 rounded-t-full border-2 border-b-0 border-white"
                    style={{ top: '-11px' }}
                  />
                  <Link
                    to="/vehicles"
                    className="relative inline-flex items-center justify-center px-8 py-2 rounded-full border-2 border-white text-white font-medium tracking-wide bg-transparent hover:bg-white/15 transition-colors"
                  >
                    Start Booking
                  </Link>
                </div>
              </div>

              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
                Your Journey Starts
                <span className="block text-white drop-shadow-lg">
                  With The Perfect Ride
                </span>
              </h1>
              <p className="text-xl text-gray-900/90 max-w-2xl mx-auto">
                Rent two-wheelers by the hour. Flexible, affordable, and always available when you need them.
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <DateTimePicker />
            </div>
          </div>
        </section>

        {/* Vehicle Carousel - ADD ID HERE */}
        <section id="featured-vehicles" className="container mx-auto px-4 py-16">
          <VehicleCarousel />
        </section>

        {/* Ratings Section */}
        <section className="bg-gray-50">
          <RatingsSection />
        </section>

        {/* FAQ Section */}
        <FAQSection />

        <Footer />
      </div>
    </>
  );
};

export default HomePage;