import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    company_name: 'HD MONKS',
    site_title: 'HD MONKS - Business Solutions',
    site_description: 'End-to-end business solutions from startup to IPO',
    company_logo_url: 'https://customer-assets.emergentagent.com/job_bizlaunch-guide-1/artifacts/7w27dsce_HD%20Monks%20%282%29.png',
    favicon_url: 'https://customer-assets.emergentagent.com/job_bizlaunch-guide-1/artifacts/7w27dsce_HD%20Monks%20%282%29.png',
    company_email: 'hdmonkslegal@gmail.com',
    company_phone: '+91-7045861090, +91-7011340279',
    company_address: '',
    social_links: { linkedin: '', twitter: '', facebook: '' }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/settings`);
      if (response.data.success && response.data.data) {
        const settingsData = response.data.data;
        // If favicon not explicitly set, fall back to company logo
        if (!settingsData.favicon_url && settingsData.company_logo_url) {
          settingsData.favicon_url = settingsData.company_logo_url;
        }
        setSettings(prev => ({...prev, ...settingsData}));
        
        // Update page title
        if (settingsData.site_title) {
          document.title = settingsData.site_title;
        }
        
        // Update meta description
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc && settingsData.site_description) {
          metaDesc.setAttribute('content', settingsData.site_description);
        }
        
        // Update favicon (use favicon_url which may be fallback to logo)
        // Add cache-busting query parameter
        if (settingsData.favicon_url) {
          // Remove all existing icon links except our dynamic ones
          document.querySelectorAll('link[rel="icon"]').forEach(link => {
            if (link.id !== 'dynamic-favicon') {
              link.remove();
            }
          });
          document.querySelectorAll('link[rel="apple-touch-icon"]').forEach(link => {
            if (link.id !== 'dynamic-apple-icon') {
              link.remove();
            }
          });
          
          // Add timestamp to bust cache
          const cachebustedUrl = settingsData.favicon_url.includes('?') 
            ? `${settingsData.favicon_url}&t=${Date.now()}`
            : `${settingsData.favicon_url}?t=${Date.now()}`;
          
          // Update favicon link
          let link = document.getElementById('dynamic-favicon');
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            link.id = 'dynamic-favicon';
            link.type = 'image/png';
            link.sizes = '32x32';
            document.head.appendChild(link);
          }
          link.href = cachebustedUrl;
          
          // Update apple touch icon
          let appleLink = document.getElementById('dynamic-apple-icon');
          if (!appleLink) {
            appleLink = document.createElement('link');
            appleLink.rel = 'apple-touch-icon';
            appleLink.id = 'dynamic-apple-icon';
            appleLink.sizes = '180x180';
            document.head.appendChild(appleLink);
          }
          appleLink.href = cachebustedUrl;
        }
      }
    } catch (error) {
      console.log('Settings not available, using defaults');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};
