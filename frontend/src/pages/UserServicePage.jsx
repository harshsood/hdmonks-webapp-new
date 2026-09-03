import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Check, FileText, Rocket, Building2, Shield, Palette, Globe, Users, BriefcaseBusiness } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';

const iconMap = { Rocket, Building2, Shield, Palette, Globe, Users, FileText, BriefcaseBusiness };
const companyTypes = ['Private Limited Company', 'LLP', 'Partnership Firm', 'OPC'];

const UserServicePage = () => {
  const { serviceId } = useParams();
  const [service, setService] = useState(null);
  const [stage, setStage] = useState(null);
  const [selectedCompanyType, setSelectedCompanyType] = useState('');
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/stages`)
      .then((response) => {
        const stages = response.data.data || [];
        const matchingStage = stages.find((item) => (item.services || []).some((serviceItem) => serviceItem.service_id === serviceId));
        const match = matchingStage?.services?.find((item) => item.service_id === serviceId);
        setStage(matchingStage || null);
        setService(match || null);
      })
      .finally(() => setLoading(false));
  }, [serviceId]);

  if (loading) return <div className="flex min-h-screen items-center justify-center text-gray-500">Loading service...</div>;
  if (!service) return <div className="min-h-screen p-8 text-center"><h1 className="text-2xl font-bold">Service not found</h1><Link to="/dashboard" className="mt-4 inline-block text-orange-600">Back to dashboard</Link></div>;

  const IconComponent = iconMap[service.icon] || FileText;
  const keyDeliverables = [
    'Initial consultation and requirement analysis',
    'Documentation preparation and review',
    'Regulatory filing and compliance',
    'Ongoing support and guidance',
    'Expert team dedicated to your success'
  ];

  const handleCompanyTypeChange = (companyType) => {
    setSelectedCompanyType(companyType);
    setSetupModalOpen(true);
  };

  const isCompanyFormation = serviceId === 'company-formation';

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link to="/dashboard" className="mb-6 inline-flex items-center text-sm font-medium text-gray-700 hover:text-orange-600"><ArrowLeft className="mr-2 h-4 w-4" />Back to dashboard</Link>

        <div className="mb-8 flex items-start gap-5">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-orange-100"><IconComponent className="h-10 w-10 text-orange-500" /></div>
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-orange-500">{stage?.title || 'Service workspace'}{stage?.id ? ` - Stage ${stage.id}` : ''}</p>
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">{service.name}</h1>
            <p className="mt-2 text-lg text-gray-600">{service.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <section className="rounded-xl border border-gray-200 bg-white p-7 shadow-sm sm:p-8">
              <h2 className="text-2xl font-bold text-gray-900">Overview</h2>
              {service.details && <div className="prose mt-4 max-w-none" dangerouslySetInnerHTML={{ __html: service.details }} />}
              <p className="mt-4 leading-relaxed text-gray-700">Our expert team brings years of experience in {service.name.toLowerCase()}, ensuring that your business stays compliant, efficient, and ready for growth. We handle the complexity so you can focus on what matters most - building your business.</p>
            </section>

            {service.content_sections?.length > 0 && service.content_sections.sort((a, b) => (a.order || 0) - (b.order || 0)).map((section, index) => (
              <section key={index} className="rounded-xl border border-gray-200 bg-white p-7 shadow-sm sm:p-8">
                <h2 className="text-2xl font-bold text-gray-900">{section.heading}</h2>
                <div className="prose mt-4 max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: section.content }} />
              </section>
            ))}

            <section className="rounded-xl border border-gray-200 bg-white p-7 shadow-sm sm:p-8">
              <h2 className="text-2xl font-bold text-gray-900">Key Deliverables</h2>
              <ul className="mt-5 space-y-3">{keyDeliverables.map((deliverable) => <li key={deliverable} className="flex items-start gap-3 text-gray-700"><span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100"><Check className="h-4 w-4 text-orange-500" /></span>{deliverable}</li>)}</ul>
            </section>
          </div>

          <aside className="lg:col-span-1">
            <div className="rounded-xl border border-gray-200 bg-white p-7 shadow-sm lg:sticky lg:top-8">
              <h2 className="text-xl font-bold text-gray-900">Service at a glance</h2>
              {service.features?.length > 0 && <ul className="mt-5 space-y-3">{service.features.map((feature) => <li key={feature} className="flex items-start gap-2 text-sm text-gray-700"><Check className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />{feature}</li>)}</ul>}
              {isCompanyFormation && (
                <div className="mt-7 border-t border-gray-100 pt-6">
                  <h3 className="text-base font-semibold text-gray-900">Which kind of company do you want to open?</h3>
                  <div className="mt-4 space-y-2" role="radiogroup" aria-label="Company type">
                    {companyTypes.map((companyType) => (
                      <label key={companyType} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-3 text-sm transition-colors ${selectedCompanyType === companyType ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-700 hover:border-orange-300'}`}>
                        <input
                          type="radio"
                          name="company-type"
                          value={companyType}
                          checked={selectedCompanyType === companyType}
                          onChange={() => handleCompanyTypeChange(companyType)}
                          className="h-4 w-4 accent-orange-500"
                        />
                        <span>{companyType}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <Link to="/dashboard" className="mt-6 block w-full rounded-lg bg-orange-500 px-4 py-3 text-center font-semibold text-white hover:bg-orange-600">Back to dashboard</Link>
            </div>
          </aside>
        </div>
      </main>

      {isCompanyFormation && (
        <Dialog open={setupModalOpen} onOpenChange={setSetupModalOpen}>
          <DialogContent className="max-w-md bg-white p-8">
            <DialogHeader>
              <DialogTitle className="text-2xl text-gray-900">Setup your {selectedCompanyType}</DialogTitle>
              <DialogDescription className="pt-2">Tell us a little more about your {selectedCompanyType} setup and our team will guide you through the next steps.</DialogDescription>
            </DialogHeader>
            <div className="mt-4 rounded-lg bg-orange-50 p-4 text-sm text-gray-700">
              You selected <strong>{selectedCompanyType}</strong>. The setup form for this company type will be available here next.
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default UserServicePage;
