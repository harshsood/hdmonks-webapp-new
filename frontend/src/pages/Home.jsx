import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Rocket,
  Building2,
  Shield,
  Palette,
  Globe,
  Users,
  FileText,
  CheckCircle,
  PenTool,
  Calculator,
  TrendingUp,
  Truck,
  Award,
  Gavel,
  BarChart,
  Search,
  DollarSign,
  Target,
  LineChart,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { testimonials } from '../data/mock';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BookingCalendar from '../components/BookingCalendar';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { toast, Toaster } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const iconMap = {
  Rocket,
  Building2,
  Shield,
  Palette,
  Globe,
  Users,
  FileText,
  CheckCircle,
  PenTool,
  Calculator,
  TrendingUp,
  Truck,
  Award,
  Gavel,
  BarChart,
  Search,
  DollarSign,
  Target,
  LineChart
};

const Home = () => {
  const [businessType, setBusinessType] = useState('startup');
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStages();
  }, []);

  const fetchStages = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/stages`);
      if (response.data.success) {
        setStages(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stages:', error);
      toast.error('Failed to load services. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredStages = stages.map(stage => ({
    ...stage,
    services: stage.services.filter(service =>
      service.relevant_for.includes(businessType)
    )
  }));

  const progressPercentage = businessType === 'startup' ? 20 : 75;

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      full_name: formData.get('full_name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      business_type: formData.get('business_type'),
      message: formData.get('message')
    };

    try {
      const response = await axios.post(`${API}/contact`, data);
      if (response.data.success) {
        toast.success('Thank you! We will get back to you soon.');
        e.target.reset();
      }
    } catch (error) {
      console.error('Error submitting contact form:', error);
      toast.error('Failed to submit inquiry. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Toaster position="top-right" richColors />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-gray-50 opacity-70"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 px-4 py-1.5 bg-orange-100 text-orange-700 hover:bg-orange-200">
              Your Business Growth Partner
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              From Idea to IPO,
              <span className="text-orange-500"> We've Got You Covered</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              End-to-end business solutions for startups and MSMEs. Legal, financial, HR, and strategic support at every stage of your journey.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-6 text-lg"
                onClick={() => document.getElementById('services').scrollIntoView({ behavior: 'smooth' })}
              >
                Explore Our Services
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-gray-300 hover:border-orange-500 hover:text-orange-500 px-8 py-6 text-lg"
                onClick={() => setIsBookingOpen(true)}
              >
                Book Free Consultation
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Toggle Section */}
      <section id="services" className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Your Personalized Business Journey
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Select your business stage to see relevant services
            </p>

            {/* Toggle Switch */}
            <div className="inline-flex items-center bg-gray-100 rounded-full p-1.5 space-x-1">
              <button
                onClick={() => setBusinessType('startup')}
                className={`px-8 py-3 rounded-full font-medium transition-all duration-300 ${
                  businessType === 'startup'
                    ? 'bg-orange-500 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                I am a New Startup
              </button>
              <button
                onClick={() => setBusinessType('msme')}
                className={`px-8 py-3 rounded-full font-medium transition-all duration-300 ${
                  businessType === 'msme'
                    ? 'bg-orange-500 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                I am an Established MSME
              </button>
            </div>
          </div>

          {/* Progress Tracker */}
          <div className="max-w-2xl mx-auto mb-16">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">Your Compliance Health</span>
              <span className="text-2xl font-bold text-orange-500">{progressPercentage}%</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 mt-2 text-center">
              {businessType === 'startup' ? 'Just getting started' : 'Well on your way to excellence'}
            </p>
          </div>

          {/* Stages Timeline */}
          <div className="space-y-8">
            {filteredStages.map((stage, index) => (
              <div
                key={stage.id}
                className="relative"
              >
                <Card className="p-6 hover:shadow-xl transition-all duration-300 border-l-4 border-l-orange-500">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Badge variant="outline" className="text-orange-600 border-orange-300">
                          Stage {stage.id}
                        </Badge>
                        <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200">
                          {stage.phase}
                        </Badge>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {stage.title}
                      </h3>
                      <p className="text-gray-600 mb-4">{stage.subtitle}</p>

                      {/* Services Grid */}
                      {stage.services.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                          {stage.services.map((service) => {
                            const IconComponent = iconMap[service.icon];
                            return (
                              <div
                                key={service.id}
                                onClick={() => navigate(`/service/${service.service_id}`)}
                                className="group p-4 bg-gray-50 rounded-lg hover:bg-orange-50 cursor-pointer transition-all duration-200 border border-transparent hover:border-orange-200"
                              >
                                <div className="flex items-start space-x-3">
                                  <div className="p-2 bg-white rounded-lg group-hover:bg-orange-500 transition-colors duration-200">
                                    <IconComponent className="h-5 w-5 text-orange-500 group-hover:text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900 mb-1 group-hover:text-orange-600">
                                      {service.name}
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                      {service.description}
                                    </p>
                                  </div>
                                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-orange-500 opacity-0 group-hover:opacity-100 transition-all duration-200" />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {stage.services.length === 0 && (
                        <p className="text-sm text-gray-500 italic mt-4">
                          Not applicable for your current business stage
                        </p>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Connector Line */}
                {index < filteredStages.length - 1 && (
                  <div className="flex justify-center py-4">
                    <div className="w-0.5 h-8 bg-gradient-to-b from-orange-300 to-orange-500"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose HD MONKS?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We provide comprehensive business solutions with expert guidance at every step
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'End-to-End Support',
                description: 'From startup incorporation to IPO readiness, we cover every aspect of your business journey.',
                icon: Target
              },
              {
                title: 'Expert Team',
                description: 'Dedicated legal, CA, HR, and digital experts with years of industry experience.',
                icon: Users
              },
              {
                title: 'Compliance Focused',
                description: 'Stay ahead of regulatory requirements with our proactive compliance management.',
                icon: Shield
              }
            ].map((feature, index) => (
              <Card key={index} className="p-8 text-center hover:shadow-xl transition-shadow duration-300">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-6">
                  <feature.icon className="h-8 w-8 text-orange-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              What Our Clients Say
            </h2>
            <p className="text-lg text-gray-600">
              Trusted by startups and MSMEs across India
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id} className="p-6 hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-orange-500 text-xl">★</span>
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">"{testimonial.text}"</p>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.company}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-lg text-gray-300">
              Let's discuss how we can help your business grow
            </p>
          </div>

          <Card className="p-8 bg-white text-gray-900">
            <form onSubmit={handleContactSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <input
                    type="text"
                    name="full_name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                    placeholder="+91 XXXXX XXXXX"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Business Type</label>
                  <select name="business_type" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all">
                    <option>New Startup</option>
                    <option>Established MSME</option>
                    <option>Growing Business</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Message</label>
                <textarea
                  name="message"
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all resize-none"
                  placeholder="Tell us about your requirements..."
                  required
                ></textarea>
              </div>

              <Button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-6 text-lg"
              >
                Submit Inquiry
                <CheckCircle2 className="ml-2 h-5 w-5" />
              </Button>
            </form>
          </Card>
        </div>
      </section>

      <Footer />
      
      {/* Booking Calendar Modal */}
      <BookingCalendar isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} />
    </div>
  );
};

export default Home;
