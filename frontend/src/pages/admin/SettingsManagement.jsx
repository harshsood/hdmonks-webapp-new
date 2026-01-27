import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { Save, Upload } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api/admin`;

const SettingsManagement = () => {
  const [settings, setSettings] = useState({
    company_name: 'HD MONKS',
    company_email: '',
    company_phone: '',
    company_address: '',
    site_title: 'HD MONKS - Business Solutions',
    site_description: 'End-to-end business solutions from startup to IPO',
    company_logo_url: 'https://customer-assets.emergentagent.com/job_bizlaunch-guide-1/artifacts/7w27dsce_HD%20Monks%20%282%29.png',
    favicon_url: '',
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_password: '',
    recipient_email: '',
    social_links: { linkedin: '', twitter: '', facebook: '' }
  });
  const [activeTab, setActiveTab] = useState('branding');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettings(response.data.data);
    } catch (error) {
      toast.error('Failed to load settings');
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      await axios.put(`${API}/settings`, settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-3xl font-bold">Settings</h1>
        <Button onClick={handleSave} className="bg-orange-500">
          <Save className="h-5 w-5 mr-2" />Save Changes
        </Button>
      </div>

      <div className="flex gap-2 border-b overflow-x-auto">
        {['branding', 'company', 'smtp', 'social'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium whitespace-nowrap ${activeTab === tab ? 'border-b-2 border-orange-500 text-orange-600' : 'text-gray-600'}`}
          >
            {tab === 'branding' ? 'Branding & Site' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <Card className="p-6">
        {activeTab === 'branding' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Site Title</label>
              <input
                type="text"
                value={settings.site_title}
                onChange={e => setSettings({...settings, site_title: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                placeholder="HD MONKS - Business Solutions"
              />
              <p className="text-xs text-gray-500 mt-1">This appears in browser tabs and search results</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Site Description</label>
              <textarea
                value={settings.site_description}
                onChange={e => setSettings({...settings, site_description: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                rows="3"
                placeholder="End-to-end business solutions from startup to IPO"
              />
              <p className="text-xs text-gray-500 mt-1">This appears in search engine results</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Company Logo URL</label>
              <input
                type="url"
                value={settings.company_logo_url}
                onChange={e => setSettings({...settings, company_logo_url: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                placeholder="https://example.com/logo.png"
              />
              {settings.company_logo_url && (
                <div className="mt-2 p-2 bg-gray-100 rounded">
                  <img src={settings.company_logo_url} alt="Logo preview" className="h-12 object-contain" />
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Favicon URL</label>
              <input
                type="url"
                value={settings.favicon_url}
                onChange={e => setSettings({...settings, favicon_url: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                placeholder="https://example.com/favicon.ico"
              />
              <p className="text-xs text-gray-500 mt-1">Browser tab icon (16x16 or 32x32 pixels)</p>
            </div>
          </div>
        )}
        {activeTab === 'company' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Company Name</label>
              <input type="text" value={settings.company_name} onChange={e => setSettings({...settings, company_name: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input type="email" value={settings.company_email} onChange={e => setSettings({...settings, company_email: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Phone</label>
              <input type="text" value={settings.company_phone} onChange={e => setSettings({...settings, company_phone: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Address</label>
              <textarea value={settings.company_address} onChange={e => setSettings({...settings, company_address: e.target.value})} className="w-full px-3 py-2 border rounded-lg" rows="3" />
            </div>
          </div>
        )}

        {activeTab === 'smtp' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">SMTP Host</label>
              <input type="text" value={settings.smtp_host} onChange={e => setSettings({...settings, smtp_host: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="smtp.gmail.com" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">SMTP Port</label>
              <input type="number" value={settings.smtp_port} onChange={e => setSettings({...settings, smtp_port: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">SMTP User</label>
              <input type="text" value={settings.smtp_user} onChange={e => setSettings({...settings, smtp_user: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">SMTP Password</label>
              <input type="password" value={settings.smtp_password} onChange={e => setSettings({...settings, smtp_password: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Recipient Email</label>
              <input type="email" value={settings.recipient_email} onChange={e => setSettings({...settings, recipient_email: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </div>
        )}

        {activeTab === 'social' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">LinkedIn URL</label>
              <input type="url" value={settings.social_links?.linkedin || ''} onChange={e => setSettings({...settings, social_links: {...settings.social_links, linkedin: e.target.value}})} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Twitter URL</label>
              <input type="url" value={settings.social_links?.twitter || ''} onChange={e => setSettings({...settings, social_links: {...settings.social_links, twitter: e.target.value}})} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Facebook URL</label>
              <input type="url" value={settings.social_links?.facebook || ''} onChange={e => setSettings({...settings, social_links: {...settings.social_links, facebook: e.target.value}})} className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default SettingsManagement;
