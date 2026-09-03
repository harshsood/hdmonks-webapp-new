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
  CheckCircle2,
  X
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

const businessStructureComparison = [
  ['No. of Owners / Members', '1', '2–50 partners', '2–50 partners', '2+ partners', '2+ shareholders', '1 shareholder'],
  ['Minimum Directors / Designated Partners', 'Not applicable', 'Not applicable', 'Not applicable', '2 designated partners', '2 directors', '1 director'],
  ['Separate Legal Entity', '❌ No', '❌ No', '❌ No', '✅ Yes', '✅ Yes', '✅ Yes'],
  ['Limited Liability', '❌ No', '❌ No', '❌ No', '✅ Yes', '✅ Yes', '✅ Yes'],
  ['Registration', 'Generally no incorporation', 'Partnership deed; registration optional', 'Registered with Registrar of Firms', 'Mandatory with MCA', 'Mandatory with MCA', 'Mandatory with MCA'],
  ['Governing Law', 'No separate incorporation law', 'Indian Partnership Act, 1932', 'Indian Partnership Act, 1932', 'LLP Act, 2008', 'Companies Act, 2013', 'Companies Act, 2013'],
  ['Separate PAN', '❌ No separate entity PAN', '❌ No separate entity PAN', '❌ No separate entity PAN', '✅ Yes', '✅ Yes', '✅ Yes'],
  ['Perpetual Succession', '❌ No', '❌ No', '❌ No', '✅ Yes', '✅ Yes', '✅ Yes'],
  ['Liability of Owner(s)', 'Unlimited', 'Unlimited', 'Unlimited', 'Limited to agreed contribution', 'Limited to shareholding', 'Limited to shareholding'],
  ['Compliance Level', '⭐ Very Low', '⭐ Low', '⭐⭐ Low–Moderate', '⭐⭐ Moderate', '⭐⭐⭐ High', '⭐⭐⭐ High'],
  ['Annual ROC/MCA Filing', '❌ No', '❌ No', '❌ No MCA filing*', '✅ Yes', '✅ Yes', '✅ Yes'],
  ['Audit Requirement', 'Based on applicable tax rules', 'Based on applicable tax rules', 'Based on applicable tax rules', 'Based on applicable thresholds', 'Generally statutory audit mandatory', 'Generally statutory audit mandatory'],
  ['Ownership Transfer', 'Difficult / not applicable', 'Relatively difficult', 'Relatively difficult', 'Relatively easier', 'Relatively easy through shares', 'Restricted compared with Pvt Ltd'],
  ['Fundraising / Investors', '❌ Limited', '❌ Limited', '❌ Limited', '⚠️ Moderate', '✅ Excellent', '⚠️ Limited'],
  ['Can Issue Shares?', '❌ No', '❌ No', '❌ No', '❌ No', '✅ Yes', '✅ Yes'],
  ['Suitable For', 'Individual freelancers, small businesses', 'Small businesses with partners', 'Businesses wanting a registered partnership', 'Professional firms, startups, SMEs', 'Startups, growing businesses, investors', 'Solo entrepreneurs wanting corporate structure'],
  ['Typical Setup Complexity', '⭐ Very Easy', '⭐ Easy', '⭐⭐ Easy–Moderate', '⭐⭐⭐ Moderate', '⭐⭐⭐ Moderate–High', '⭐⭐⭐ Moderate–High'],
  ['Best For', 'Single-person small business', 'Small partnership based on mutual trust', 'Partnership wanting registration benefits', 'Limited liability + partnership flexibility', 'Growth, funding & credibility', 'One-person business wanting Pvt Ltd status']
];

const businessStructureColumns = [
  'Key Difference',
  'Proprietorship',
  'Partnership – Non-Registered',
  'Partnership – Registered',
  'LLP',
  'Private Limited Company – 2 Directors',
  'OPC Pvt. Ltd. – 1 Director'
];

const Home = () => {
  const [businessType, setBusinessType] = useState('startup');
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [hasShownComparison, setHasShownComparison] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStages();
  }, []);

  useEffect(() => {
    if (!isComparisonOpen) return undefined;

    const handleEscape = (event) => {
      if (event.key === 'Escape') setIsComparisonOpen(false);
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isComparisonOpen]);

  const fetchStages = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/stages?t=${Date.now()}`);
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
    services: (stage.services || []).filter(service => {
      // Handle missing or invalid relevant_for field
      if (!service.relevant_for || !Array.isArray(service.relevant_for)) {
        console.warn('Service missing valid relevant_for field:', service);
        return false; // Hide services with invalid data
      }
      return service.relevant_for.includes(businessType);
    })
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
            {filteredStages.length > 0 ? (
              filteredStages.map((stage, index) => (
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
                      {(stage.services || []).length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                          {(stage.services || []).map((service) => {
                            const IconComponent = iconMap[service.icon];
                            return (
                              <div
                                key={service.id}
                                onClick={() => navigate(`/service/${service.service_id}`)}
                                onMouseEnter={() => {
                                  if (service.name === 'Company Formation' && !hasShownComparison) {
                                    setHasShownComparison(true);
                                    setIsComparisonOpen(true);
                                  }
                                }}
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

                      {(stage.services || []).length === 0 && (
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
            ))
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">No services available at the moment.</p>
              </div>
            )}
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

      {/* Company Formation comparison modal */}
      {isComparisonOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/70 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsComparisonOpen(false);
          }}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-[ min(1400px, 96vw)] overflow-hidden rounded-xl bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="business-structure-comparison-title"
          >
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 bg-orange-50 px-5 py-4 sm:px-7">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">Company Formation</p>
                <h2 id="business-structure-comparison-title" className="mt-1 text-xl font-bold text-gray-900 sm:text-2xl">
                  Comparison of Business Structures in India
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close comparison chart"
                title="Close comparison chart"
                onClick={() => setIsComparisonOpen(false)}
                className="shrink-0 rounded-full p-2 text-gray-500 hover:bg-white hover:text-gray-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[calc(90vh-100px)] overflow-auto px-5 py-5 sm:px-7">
              <table className="min-w-[1280px] border-collapse text-left text-sm text-gray-700">
                <thead>
                  <tr>
                    {businessStructureColumns.map((column, index) => (
                      <th
                        key={column}
                        scope="col"
                        className={`border border-gray-200 bg-gray-900 px-4 py-3 font-semibold text-white ${index === 0 ? 'sticky left-0 z-10 min-w-[220px]' : 'min-w-[170px]'}`}
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {businessStructureComparison.map((row) => (
                    <tr key={row[0]} className="even:bg-gray-50">
                      {row.map((cell, index) => (
                        <td
                          key={`${row[0]}-${index}`}
                          className={`border border-gray-200 px-4 py-3 align-top ${index === 0 ? 'sticky left-0 z-[1] bg-white font-semibold text-gray-900' : ''}`}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
