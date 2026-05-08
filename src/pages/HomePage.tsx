import VehicleCarousel from '../components/VehicleCarousel';
import Header from '../components/Header';
import DateTimePicker from '../components/DateTimePicker';
import FAQSection from '../components/FAQSection';
import RatingsSection from '../components/RatingsSection';
import HeroSlideshow from '../components/HeroSlideshow';

import { useGetFeaturedVehiclesQuery } from '../store/api/vehicleApi';
import { useAppSelector } from '../store/hooks';

const HomePage: React.FC = () => {
  const selectedCity = useAppSelector((state) => state.city.selectedCity);

  const { data: vehicles = [], isLoading, error } =
    useGetFeaturedVehiclesQuery(
      selectedCity ? { cityId: selectedCity.id } : undefined
    );

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-indigo-50 to-purple-50">

        {/* Hero */}
        <HeroSlideshow />

        {/* Search */}
        <div className="container mx-auto px-4 -mt-6 md:-mt-8 relative z-30 mb-12 md:mb-16">
          <div className="max-w-6xl mx-auto">
            <DateTimePicker />
          </div>
        </div>

        {/* ✅ Vehicle Section (ONLY if data exists) */}
        {!isLoading && !error && vehicles.length > 0 && (
          <section id="featured-vehicles" className="container mx-auto px-4 py-16">
            <VehicleCarousel vehicles={vehicles} />
          </section>
        )}

        {/* Ratings */}
        <section className="bg-gray-50">
          <RatingsSection />
        </section>

        {/* FAQ */}
        <FAQSection />
      </div>
    </>
  );
};

export default HomePage;