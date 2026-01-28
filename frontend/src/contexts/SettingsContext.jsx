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
    company_email: 'contact@hdmonks.com',
    company_phone: '+91 XXX XXX XXXX',
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
        
        // Update favicon
        if (settingsData.favicon_url) {
          let link = document.querySelector('link[rel="icon"]');
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
          }
          link.href = settingsData.favicon_url;
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
