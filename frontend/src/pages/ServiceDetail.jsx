import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  ArrowLeft,
  Check
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useSettings } from '../contexts/SettingsContext';
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

const ServiceDetail = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const { settings } = useSettings();

  const fetchService = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/services/${serviceId}`);
      if (response.data.success) {
        setService(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching service:', error);
      toast.error('Service not found');
      setTimeout(() => navigate('/'), 2000);
    } finally {
      setLoading(false);
    }
  }, [serviceId, navigate]);

  useEffect(() => {
    fetchService();
  }, [fetchService]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading service details...</p>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Not Found</h1>
          <Button onClick={() => navigate('/')}>Return to Home</Button>
        </div>
      </div>
    );
  }

  const IconComponent = iconMap[service.icon];
  const stageInfo = service.stage_info || {};

  const keyDeliverables = [
    'Initial consultation and requirement analysis',
    'Documentation preparation and review',
    'Regulatory filing and compliance',
    'Ongoing support and guidance',
    'Expert team dedicated to your success'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Toaster position="top-right" richColors />

      <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <Button
            variant="ghost"
            className="mb-6 hover:text-orange-500"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Services
          </Button>

          <div className="mb-8">
            <Badge className="mb-4 bg-orange-100 text-orange-700 hover:bg-orange-200">
              {stageInfo.title} - Stage {stageInfo.id}
            </Badge>
            <div className="flex items-start space-x-6">
              <div className="p-4 bg-orange-100 rounded-2xl">
                <IconComponent className="h-12 w-12 text-orange-500" />
              </div>
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  {service.name}
                </h1>
                <p className="text-xl text-gray-600">
                  {service.description}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Card className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Overview</h2>
                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: service.details }}
                />
                <p className="text-gray-700 leading-relaxed">
                  Our expert team brings years of experience in {service.name.toLowerCase()}, ensuring that your business stays compliant, efficient, and ready for growth. We handle the complexity so you can focus on what matters most - building your business.
                </p>
              </Card>

              {service.content_sections && service.content_sections.length > 0 && (
                <>
                  {service.content_sections
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map((section, index) => (
                      <Card key={index} className="p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                          {section.heading}
                        </h2>
                        <div
                          className="prose max-w-none text-gray-700 leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: section.content }}
                        />
                      </Card>
                    ))}
                </>
              )}

              <Card className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Deliverables</h2>
                <ul className="space-y-4">
                  {keyDeliverables.map((deliverable, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                          <Check className="h-4 w-4 text-orange-500" />
                        </div>
                      </div>
                      <span className="text-gray-700">{deliverable}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="p-8 bg-orange-50 border-orange-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Who is this for?</h2>
                <div className="space-y-3">
                  {service.relevant_for.includes('startup') && (
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className="text-orange-600 border-orange-300">
                        New Startups
                      </Badge>
                      <span className="text-gray-700">Perfect for businesses just getting started</span>
                    </div>
                  )}
                  {service.relevant_for.includes('msme') && (
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className="text-orange-600 border-orange-300">
                        Established MSMEs
                      </Badge>
                      <span className="text-gray-700">Ideal for growing and scaling businesses</span>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card className="p-8 sticky top-24">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Get Started Today</h3>
                <div className="space-y-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Free initial consultation</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Transparent pricing</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Expert team assigned</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Quick turnaround time</span>
                  </div>
                </div>

                <Button
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white mb-3"
                  onClick={() => {
                    navigate('/#contact');
                    setTimeout(() => {
                      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }}
                >
                  Request Consultation
                </Button>

                <Button
                  variant="outline"
                  className="w-full border-2 border-gray-300 hover:border-orange-500 hover:text-orange-500"
                  onClick={() => navigate('/')}
                >
                  View All Services
                </Button>

                <div className="mt-8 pt-8 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">Need help deciding?</p>
                  <p className="text-sm font-medium text-gray-900">Call us at:</p>
                  <p className="text-lg font-bold text-orange-500">{settings.company_phone || '+91-7045861090, +91-7011340279'}</p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ServiceDetail;
