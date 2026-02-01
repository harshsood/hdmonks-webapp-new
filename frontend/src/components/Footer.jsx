import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Linkedin, Twitter, Facebook } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { settings } = useSettings();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <img
              src={settings.company_logo_url}
              alt={settings.company_name}
              className="h-12 w-auto mb-4 brightness-0 invert"
            />
            <p className="text-sm text-gray-400 mb-4">
              {settings.company_name} - {settings.site_description}
            </p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-orange-500 transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-orange-500 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-orange-500 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a href="/#services" className="text-sm hover:text-orange-500 transition-colors">
                  Our Services
                </a>
              </li>
              <li>
                <a href="/#about" className="text-sm hover:text-orange-500 transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="/#contact" className="text-sm hover:text-orange-500 transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Services</h3>
            <ul className="space-y-2 text-sm">
              <li className="hover:text-orange-500 transition-colors cursor-pointer">Company Formation</li>
              <li className="hover:text-orange-500 transition-colors cursor-pointer">Taxation & Accounting</li>
              <li className="hover:text-orange-500 transition-colors cursor-pointer">Legal Advisory</li>
              <li className="hover:text-orange-500 transition-colors cursor-pointer">Digital Marketing</li>
              <li className="hover:text-orange-500 transition-colors cursor-pointer">Funding Support</li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Contact Info</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3 text-sm">
                <Mail className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <span>{settings.company_email || 'hdmonkslegal@gmail.com'}</span>
              </li>
              <li className="flex items-start space-x-3 text-sm">
                <Phone className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <span>{settings.company_phone || '+91-7045861090, +91-7011340279'}</span>
              </li>
              <li className="flex items-start space-x-3 text-sm">
                <MapPin className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <span>{settings.company_address || 'Your Business Address'}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-gray-400">
              © {currentYear} {settings.company_name} Private Limited. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm">
              <a href="#" className="hover:text-orange-500 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-orange-500 transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
