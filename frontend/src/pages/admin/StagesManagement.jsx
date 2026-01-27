import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Edit, Layers } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const StagesManagement = () => {
  const [stages, setStages] = useState([]);

  useEffect(() => {
    fetchStages();
  }, []);

  const fetchStages = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/stages`);
      setStages(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load stages');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Stages Management</h1>
        <p className="text-gray-600 mt-1">View and manage business journey stages</p>
      </div>

      <div className="space-y-4">
        {stages.map(stage => (
          <Card key={stage.id} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="outline" className="text-orange-600">Stage {stage.id}</Badge>
                  <Badge>{stage.phase}</Badge>
                </div>
                <h2 className="text-2xl font-bold">{stage.title}</h2>
                <p className="text-gray-600 mt-1">{stage.subtitle}</p>
              </div>
              <Button size="sm" variant="outline">
                <Edit className="h-4 w-4 mr-2" />Edit Stage
              </Button>
            </div>
            
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="h-5 w-5 text-gray-500" />
                <h3 className="font-semibold">Services ({stage.services?.length || 0})</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {stage.services?.map(service => (
                  <div key={service.id} className="p-3 bg-gray-50 rounded-lg border">
                    <p className="font-medium">{service.name}</p>
                    <p className="text-sm text-gray-600">{service.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default StagesManagement;
