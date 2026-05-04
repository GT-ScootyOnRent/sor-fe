import { useState } from 'react';
import Header from '../components/Header';
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
    <div className="min-h-screen bg-white relative">
      <BackgroundSlideshow />
      <div className="relative z-10">
        <Header />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl text-black mb-8">Contact Us</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Information */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl text-black mb-6">Get in Touch</h2>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-primary-500" />
                  </div>
                  <div>
                    <h3 className="text-black mb-1">Phone</h3>
                    <p className="text-gray-600">+91 9983391137</p>
                    <p className="text-gray-600">+91 98765 43211</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-primary-500" />
                  </div>
                  <div>
                    <h3 className="text-black mb-1">Email</h3>
                    <p className="text-gray-600">info@scootyonrent.com</p>
                    <p className="text-gray-600">support@scootyonrent.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-primary-500" />
                  </div>
                  <div>
                    <h3 className="text-black mb-1">Office Address</h3>
                    <p className="text-gray-600">
                      123, Main Road,<br />
                      City Center,<br />
                      India - 313001
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-primary-500" />
                  </div>
                  <div>
                    <h3 className="text-black mb-1">Business Hours</h3>
                    <p className="text-gray-600">Monday - Sunday</p>
                    <p className="text-gray-600">8:00 AM - 8:00 PM</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links
            <div className="bg-primary-50 rounded-lg border border-primary-200 p-6">
              <h3 className="text-black mb-4">Quick Support</h3>
              <p className="text-sm text-gray-700 mb-4">
                For immediate assistance, you can reach us on WhatsApp or call our 24/7 helpline.
              </p>
              <Button className="w-full bg-primary-500 hover:bg-primary-600 text-white">
                Chat on WhatsApp
              </Button>
            </div> */}
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <h2 className="text-2xl text-black mb-6">Send us a Message</h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="mt-2"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    required
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us more about your inquiry..."
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    required
                    rows={6}
                    className="mt-2"
                  />
                </div>

                <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-primary-500 hover:bg-primary-600 text-white py-6"
                      >
                        {isSubmitting ? 'Sending...' : 'Send Message'}
                      </Button>
              </form>
            </div>

          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
