import { Link } from 'react-router-dom';
import {
    MapPin,
    Users,
    Bike,
    Shield,
    Clock,
    Wallet,
    Heart,
    Target,
    Eye,
    ArrowRight
} from 'lucide-react';
import Header from '../components/Header';

const stats = [
    { icon: MapPin, value: '1', label: 'City', sublabel: 'Udaipur' },
    { icon: Bike, value: '5+', label: 'Vehicles', sublabel: 'In our fleet' },
    { icon: Users, value: '100+', label: 'Happy Customers', sublabel: 'And counting' },
];

const values = [
    {
        icon: Shield,
        title: 'Trust & Safety',
        description: 'All our vehicles are regularly serviced and maintained to ensure your safety on every ride.'
    },
    {
        icon: Wallet,
        title: 'Budget Friendly',
        description: 'Transparent pricing with no hidden charges. Pay only for what you use.'
    },
    {
        icon: Clock,
        title: 'Easy Booking',
        description: 'Book your ride in minutes. Flexible pickup and drop-off timings that suit your schedule.'
    },
    {
        icon: Heart,
        title: 'Customer First',
        description: 'Your satisfaction is our priority. We\'re here to make your travel experience seamless.'
    },
];

export default function AboutUs() {
    return (
        <>
            <Header />
            <div className="min-h-screen bg-gradient-to-br from-primary-50 via-indigo-50 to-purple-50">

                {/* Hero Section */}
                <section className="relative py-20 md:py-28 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-800 opacity-95" />
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />

                    <div className="container mx-auto px-4 relative z-10">
                        <div className="max-w-3xl mx-auto text-center text-white">
                            <h1 className="text-4xl md:text-5xl font-bold mb-6">
                                About Wheels On Rent
                            </h1>
                            <p className="text-xl md:text-2xl text-primary-100 leading-relaxed">
                                Making travel and commute budget-friendly for everyone in Udaipur
                            </p>
                        </div>
                    </div>
                </section>

                {/* Our Story Section */}
                <section className="py-16 md:py-24">
                    <div className="container mx-auto px-4">
                        <div className="max-w-4xl mx-auto">
                            <div className="grid md:grid-cols-2 gap-12 items-center">
                                <div>
                                    <span className="inline-block px-4 py-1.5 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold mb-4">
                                        Our Story
                                    </span>
                                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                                        Started in 2026, <br />
                                        <span className="text-primary-600">Right Here in Udaipur</span>
                                    </h2>
                                    <p className="text-gray-600 text-lg leading-relaxed mb-4">
                                        Wheels On Rent was born from a simple idea: everyone deserves affordable and convenient transportation.
                                        We noticed that travelers and locals in Udaipur often struggled to find reliable, budget-friendly vehicles for their daily commute and travel needs.
                                    </p>
                                    <p className="text-gray-600 text-lg leading-relaxed">
                                        That's when we decided to bridge this gap. Today, we're proud to serve the beautiful city of Udaipur,
                                        helping people explore the City of Lakes and beyond without breaking the bank.
                                    </p>
                                </div>
                                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                                            <MapPin className="w-6 h-6 text-primary-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Based in</p>
                                            <p className="text-xl font-bold text-gray-900">Udaipur, Rajasthan</p>
                                        </div>
                                    </div>
                                    <div className="h-px bg-gray-200 my-4" />
                                    <p className="text-gray-600 italic">
                                        "We believe that exploring your city or traveling to new places shouldn't be expensive.
                                        Our mission is to make every journey affordable and memorable."
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Mission & Vision */}
                <section className="py-16 bg-white">
                    <div className="container mx-auto px-4">
                        <div className="max-w-5xl mx-auto">
                            <div className="grid md:grid-cols-2 gap-8">
                                {/* Mission */}
                                <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-8 border border-primary-200">
                                    <div className="w-14 h-14 bg-primary-600 rounded-xl flex items-center justify-center mb-6">
                                        <Target className="w-7 h-7 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
                                    <p className="text-gray-700 leading-relaxed">
                                        To provide affordable, reliable, and convenient vehicle rental services that make
                                        travel accessible to everyone. We aim to simplify your commute and help you explore
                                        more while spending less.
                                    </p>
                                </div>

                                {/* Vision */}
                                <div className="bg-gradient-to-br from-indigo-50 to-purple-100 rounded-2xl p-8 border border-indigo-200">
                                    <div className="w-14 h-14 bg-indigo-600 rounded-xl flex items-center justify-center mb-6">
                                        <Eye className="w-7 h-7 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h3>
                                    <p className="text-gray-700 leading-relaxed">
                                        To become Rajasthan's most trusted vehicle rental platform, expanding across cities
                                        while maintaining our commitment to affordability, quality, and exceptional customer service.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Stats Section */}
                <section className="py-16 md:py-20 bg-gradient-to-r from-primary-600 to-primary-800">
                    <div className="container mx-auto px-4">
                        <div className="max-w-4xl mx-auto">
                            <div className="grid grid-cols-3 gap-6 md:gap-12">
                                {stats.map((stat, index) => (
                                    <div key={index} className="text-center">
                                        <div className="w-12 h-12 md:w-16 md:h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                                            <stat.icon className="w-6 h-6 md:w-8 md:h-8 text-white" />
                                        </div>
                                        <p className="text-3xl md:text-4xl font-bold text-white mb-1">{stat.value}</p>
                                        <p className="text-primary-100 font-medium">{stat.label}</p>
                                        <p className="text-primary-200 text-sm hidden md:block">{stat.sublabel}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Values Section */}
                <section className="py-16 md:py-24">
                    <div className="container mx-auto px-4">
                        <div className="max-w-5xl mx-auto">
                            <div className="text-center mb-12">
                                <span className="inline-block px-4 py-1.5 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold mb-4">
                                    Why Choose Us
                                </span>
                                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                                    What Makes Us Different
                                </h2>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                {values.map((value, index) => (
                                    <div
                                        key={index}
                                        className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-primary-200 transition-all"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <value.icon className="w-6 h-6 text-primary-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900 mb-2">{value.title}</h3>
                                                <p className="text-gray-600">{value.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-16 md:py-20 bg-white">
                    <div className="container mx-auto px-4">
                        <div className="max-w-3xl mx-auto text-center">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                                Ready to Hit the Road?
                            </h2>
                            <p className="text-gray-600 text-lg mb-8">
                                Browse our collection of well-maintained vehicles and find the perfect ride for your next adventure.
                            </p>
                            <Link
                                to="/vehicles"
                                className="inline-flex items-center gap-2 px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all"
                            >
                                View Our Vehicles
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                </section>

            </div>
        </>
    );
}
