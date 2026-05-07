import { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import BackgroundSlideshow from '../components/BackgroundSlideshow';
import { toast } from 'sonner';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!formData.name || !formData.phone || !formData.message) {
    toast.error('Please fill all required fields.');
    return;
  }
  setIsSubmitting(true);
  try {
    await new Promise((resolve) => setTimeout(resolve, 500)); 
    toast.success('Thank you for your message!', {
      description: 'We will get back to you within 24 hours.',
    });
    setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
  } catch {
    toast.error('Failed to send message. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};


 return (
  <div className="min-h-screen bg-[#f5fbfb] relative overflow-hidden">
    <BackgroundSlideshow />

    <div className="relative z-10">
      <Header />

      {/* Hero */}
      <section className="pt-14 sm:pt-16 lg:pt-20 pb-8 sm:pb-10 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-5 leading-tight">
            Get In Touch
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto px-2">
            Have questions about rentals, bookings, or support? Our team is
            always ready to help you with quick assistance and smooth service.
          </p>
        </div>
      </section>

      {/* Main Card */}
      <section className="pb-14 sm:pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 rounded-[28px] overflow-hidden shadow-2xl bg-white">

            {/* LEFT SIDE */}
            <div className="lg:col-span-2 bg-primary-500 relative overflow-hidden">

              {/* Decorative Circle */}
              <div className="absolute -bottom-20 -right-20 w-56 sm:w-72 h-56 sm:h-72 rounded-full bg-white/20"></div>

              <div className="relative z-10 p-6 sm:p-8 lg:p-10 h-full flex flex-col justify-between">

                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                    Contact Information
                  </h2>

                  <p className="text-white/80 text-sm sm:text-base leading-relaxed mb-10">
                    Feel free to contact us anytime. We’ll get back to you as
                    soon as possible.
                  </p>

                  <div className="space-y-7">

                    {/* Phone */}
                    <div className="flex items-start gap-4">
                      <div className="min-w-[48px] h-12 rounded-full bg-white/20 flex items-center justify-center">
                        <Phone className="w-5 h-5 text-white" />
                      </div>

                      <div>
                        <h3 className="text-white font-semibold text-base sm:text-lg mb-1">
                          Phone
                        </h3>

                        <p className="text-white/80 text-sm sm:text-base">
                          +91 9983391137
                        </p>

                        <p className="text-white/80 text-sm sm:text-base">
                          +91 98765 43211
                        </p>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="flex items-start gap-4">
                      <div className="min-w-[48px] h-12 rounded-full bg-white/20 flex items-center justify-center">
                        <Mail className="w-5 h-5 text-white" />
                      </div>

                      <div className="break-all">
                        <h3 className="text-white font-semibold text-base sm:text-lg mb-1">
                          Email
                        </h3>

                        <p className="text-white/80 text-sm sm:text-base">
                          info@scootyonrent.com
                        </p>

                        <p className="text-white/80 text-sm sm:text-base">
                          support@scootyonrent.com
                        </p>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="flex items-start gap-4">
                      <div className="min-w-[48px] h-12 rounded-full bg-white/20 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-white" />
                      </div>

                      <div>
                        <h3 className="text-white font-semibold text-base sm:text-lg mb-1">
                          Office Address
                        </h3>

                        <p className="text-white/80 text-sm sm:text-base leading-relaxed">
                          123, Main Road,
                          <br />
                          City Center,
                          <br />
                          India - 313001
                        </p>
                      </div>
                    </div>

                    {/* Business Hours */}
                    <div className="flex items-start gap-4">
                      <div className="min-w-[48px] h-12 rounded-full bg-white/20 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-white" />
                      </div>

                      <div>
                        <h3 className="text-white font-semibold text-base sm:text-lg mb-1">
                          Business Hours
                        </h3>

                        <p className="text-white/80 text-sm sm:text-base">
                          Monday - Sunday
                        </p>

                        <p className="text-white/80 text-sm sm:text-base">
                          8:00 AM - 8:00 PM
                        </p>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE FORM */}
            <div className="lg:col-span-3 bg-white">
              <div className="p-6 sm:p-8 md:p-10 lg:p-14">

                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 sm:mb-10">
                  Send Message
                </h2>

                <form
                  onSubmit={handleSubmit}
                  className="space-y-7 sm:space-y-8"
                >

                  {/* Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-7 sm:gap-8">

                    {/* Name */}
                    <div>
                      <Label
                        htmlFor="name"
                        className="text-gray-500 text-sm"
                      >
                        Your Name *
                      </Label>

                      <Input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            name: e.target.value,
                          })
                        }
                        required
                        className="mt-3 border-0 border-b border-gray-300 rounded-none px-0 py-3 shadow-none focus-visible:ring-0 focus:border-primary-500 bg-transparent text-base sm:text-lg"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <Label
                        htmlFor="email"
                        className="text-gray-500 text-sm"
                      >
                        Your Email
                      </Label>

                      <Input
                        id="email"
                        type="email"
                        placeholder="hello@example.com"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            email: e.target.value,
                          })
                        }
                        className="mt-3 border-0 border-b border-gray-300 rounded-none px-0 py-3 shadow-none focus-visible:ring-0 focus:border-primary-500 bg-transparent text-base sm:text-lg"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <Label
                      htmlFor="phone"
                      className="text-gray-500 text-sm"
                    >
                      Phone Number *
                    </Label>

                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+91 XXXXX XXXXX"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          phone: e.target.value,
                        })
                      }
                      required
                      className="mt-3 border-0 border-b border-gray-300 rounded-none px-0 py-3 shadow-none focus-visible:ring-0 focus:border-primary-500 bg-transparent text-base sm:text-lg"
                    />
                  </div>

                  {/* Subject */}
                  <div>
                    <Label
                      htmlFor="subject"
                      className="text-gray-500 text-sm"
                    >
                      Subject
                    </Label>

                    <Input
                      id="subject"
                      type="text"
                      placeholder="How can we help you?"
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          subject: e.target.value,
                        })
                      }
                      className="mt-3 border-0 border-b border-gray-300 rounded-none px-0 py-3 shadow-none focus-visible:ring-0 focus:border-primary-500 bg-transparent text-base sm:text-lg"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <Label
                      htmlFor="message"
                      className="text-primary-500 text-sm"
                    >
                      Message *
                    </Label>

                    <Textarea
                      id="message"
                      placeholder="Write your message here..."
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          message: e.target.value,
                        })
                      }
                      required
                      rows={5}
                      className="mt-3 border-0 border-b border-gray-300 rounded-none px-0 resize-none shadow-none focus-visible:ring-0 focus:border-primary-500 bg-transparent text-base sm:text-lg"
                    />
                  </div>

                  {/* Button */}
                  <div className="pt-2 sm:pt-4">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto bg-primary-500 hover:bg-primary-600 text-white h-12 sm:h-14 px-8 sm:px-10 rounded-xl text-sm sm:text-base font-semibold shadow-lg hover:scale-[1.02] transition-all duration-300"
                    >
                      {isSubmitting ? "Sending..." : "Send Message"}
                    </Button>
                  </div>

                </form>
              </div>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </div>
  </div>
);
}
