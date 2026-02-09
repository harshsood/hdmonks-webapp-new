import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Edit, Layers, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const StagesManagement = () => {
  const [stages, setStages] = useState([]);
  const [editingStage, setEditingStage] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);

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

  const openEditModal = (stage) => {
    setEditingStage(stage);
    setEditFormData({
      id: stage.id,
      title: stage.title || '',
      subtitle: stage.subtitle || '',
      phase: stage.phase || '',
      description: stage.description || '',
    });
  };

  const closeEditModal = () => {
    setEditingStage(null);
    setEditFormData({});
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveStage = async () => {
    try {
      setIsSaving(true);
      
      // Prepare update data (only changed fields)
      const updateData = {};
      if (editFormData.title !== editingStage.title) updateData.title = editFormData.title;
      if (editFormData.subtitle !== editingStage.subtitle) updateData.subtitle = editFormData.subtitle;
      if (editFormData.phase !== editingStage.phase) updateData.phase = editFormData.phase;
      if (editFormData.description !== editingStage.description) updateData.description = editFormData.description;

      if (Object.keys(updateData).length === 0) {
        toast.info('No changes to save');
        closeEditModal();
        return;
      }

      const token = localStorage.getItem('admin_token');
      const response = await axios.put(
        `${BACKEND_URL}/api/admin/stages/${editFormData.id}`,
        updateData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        toast.success('Stage updated successfully');
        await fetchStages();
        closeEditModal();
      }
    } catch (error) {
      console.error('Error updating stage:', error);
      toast.error(error.response?.data?.detail || 'Failed to update stage');
    } finally {
      setIsSaving(false);
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
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => openEditModal(stage)}
              >
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

      {/* Edit Stage Modal */}
      <Dialog open={!!editingStage} onOpenChange={(open) => !open && closeEditModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Stage</DialogTitle>
            <DialogDescription>
              Update the details of this business journey stage
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Stage Title *</Label>
              <Input
                id="title"
                name="title"
                value={editFormData.title || ''}
                onChange={handleFormChange}
                placeholder="e.g., Incubation & Identity"
              />
            </div>

            <div>
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input
                id="subtitle"
                name="subtitle"
                value={editFormData.subtitle || ''}
                onChange={handleFormChange}
                placeholder="Brief description"
              />
            </div>

            <div>
              <Label htmlFor="phase">Phase</Label>
              <Input
                id="phase"
                name="phase"
                value={editFormData.phase || ''}
                onChange={handleFormChange}
                placeholder="e.g., Foundation"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                value={editFormData.description || ''}
                onChange={handleFormChange}
                placeholder="Detailed description"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeEditModal}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveStage}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StagesManagement;
