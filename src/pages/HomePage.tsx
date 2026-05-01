import VehicleCarousel from '../components/VehicleCarousel';
import Header from '../components/Header';
import Footer from '../components/Footer';
import DateTimePicker from '../components/DateTimePicker';
import FAQSection from '../components/FAQSection';
import RatingsSection from '../components/RatingsSection';
import HeroSlideshow from '../components/HeroSlideshow';

const HomePage: React.FC = () => {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-indigo-50 to-purple-50">

        {/* Hero slideshow — title/subtitle overlay comes from each banner */}
        <HeroSlideshow />

        {/* Search bar — overlaps the bottom edge of the hero (negative margin pulls it up) */}
        <div className="container mx-auto px-4 -mt-8 md:-mt-12 relative z-30 mb-12 md:mb-16">
          <div className="max-w-6xl mx-auto">
            <DateTimePicker />
          </div>
        </div>

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
