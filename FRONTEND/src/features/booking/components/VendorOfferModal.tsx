import React, { useState, useEffect } from 'react';
import { X, DollarSign, Package, Plus, Trash2 } from 'lucide-react';
import { Button } from '../../../components/atoms/Button';
import { Textarea } from '../../../components/atoms/Textarea';
import { useToast } from '../../../components/atoms/Toast';
import { useBookingActions } from '../hooks/useBookingActions';
import type { VendorOffer } from './OfferList';

interface VendorOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  bookingNumber?: string;
  existingOffer?: VendorOffer;
  onSuccess?: () => void;
}

interface ExtraService {
  name: string;
  description: string;
  price: number;
}

interface OfferData {
  offerAmount: number;
  extraServices: ExtraService[];
  notes?: string;
}

export const VendorOfferModal: React.FC<VendorOfferModalProps> = ({
  isOpen,
  onClose,
  bookingId,
  bookingNumber,
  existingOffer,
  onSuccess,
}) => {
  const [offerData, setOfferData] = useState<OfferData>({
    offerAmount: 0,
    extraServices: [],
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();
  const { submitVendorOffer, updateVendorOffer } = useBookingActions();

  // Load existing offer data when editing
  useEffect(() => {
    if (existingOffer && isOpen) {
      // Handle both old string format and new array format
      let extraServicesArray: ExtraService[] = [];
      if (Array.isArray(existingOffer.extraServices)) {
        extraServicesArray = existingOffer.extraServices;
      } else if (typeof existingOffer.extraServices === 'string' && existingOffer.extraServices.trim()) {
        // Convert old string format to array format (for backward compatibility)
        extraServicesArray = [{
          name: 'Service',
          description: existingOffer.extraServices,
          price: 0,
        }];
      }

      setOfferData({
        offerAmount: existingOffer.offerAmount || 0,
        extraServices: extraServicesArray,
        notes: existingOffer.notes || '',
      });
    } else if (isOpen) {
      // Reset form for new offer - start with one empty service
      setOfferData({
        offerAmount: 0,
        extraServices: [{ name: '', description: '', price: 0 }],
        notes: '',
      });
    }
  }, [existingOffer, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field: keyof OfferData, value: string | number | ExtraService[]) => {
    setOfferData(prev => ({ ...prev, [field]: value }));
  };

  const handleExtraServiceChange = (index: number, field: keyof ExtraService, value: string | number) => {
    setOfferData(prev => {
      const newServices = [...prev.extraServices];
      newServices[index] = { ...newServices[index], [field]: value };
      return { ...prev, extraServices: newServices };
    });
  };

  const addExtraService = () => {
    setOfferData(prev => ({
      ...prev,
      extraServices: [...prev.extraServices, { name: '', description: '', price: 0 }],
    }));
  };

  const removeExtraService = (index: number) => {
    setOfferData(prev => ({
      ...prev,
      extraServices: prev.extraServices.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    // Validation
    if (offerData.offerAmount <= 0) {
      toast.error('Offer amount must be greater than 0');
      return;
    }

    // Filter out empty services and validate
    const validServices = offerData.extraServices.filter(
      service => service.name.trim() && service.description.trim()
    );

    if (validServices.length === 0) {
      toast.error('Please add at least one extra service with name and description');
      return;
    }

    // Validate each service has required fields
    for (const service of validServices) {
      if (!service.name.trim()) {
        toast.error('All services must have a name');
        return;
      }
      if (!service.description.trim()) {
        toast.error('All services must have a description');
        return;
      }
      if (service.price < 0) {
        toast.error('Service price cannot be negative');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        offerAmount: offerData.offerAmount,
        extraServices: validServices,
        notes: offerData.notes || undefined,
      };

      if (existingOffer) {
        // Update existing offer
        await updateVendorOffer(bookingId, existingOffer.id, payload);
        toast.success('Offer updated successfully!');
      } else {
        // Create new offer
        await submitVendorOffer(bookingId, payload);
        toast.success('Offer submitted successfully!');
      }

      setOfferData({
        offerAmount: 0,
        extraServices: [{ name: '', description: '', price: 0 }],
        notes: '',
      });
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toast.error(error.message || `Failed to ${existingOffer ? 'update' : 'submit'} offer`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setOfferData({
      offerAmount: 0,
      extraServices: [{ name: '', description: '', price: 0 }],
      notes: '',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white shadow-xl bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {existingOffer ? 'Edit Offer' : 'Submit Offer'}
            </h3>
            {bookingNumber && (
              <p className="text-sm text-gray-500 mt-1">Booking: {bookingNumber}</p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Offer Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Offer Amount (₹) *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                value={offerData.offerAmount || ''}
                onChange={(e) => handleChange('offerAmount', Number(e.target.value))}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Extra Services */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Extra Services *
              </label>
              <Button
                type="button"
                variant="muted"
                size="sm"
                onClick={addExtraService}
                className="flex items-center gap-1 text-xs"
              >
                <Plus className="w-3 h-3" />
                Add Service
              </Button>
            </div>
            <div className="space-y-3">
              {offerData.extraServices.map((service, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-400" />
                      <span className="text-xs font-medium text-gray-600">Service {index + 1}</span>
                    </div>
                    {offerData.extraServices.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeExtraService(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Service Name *
                      </label>
                      <input
                        type="text"
                        value={service.name}
                        onChange={(e) => handleExtraServiceChange(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                        placeholder="e.g., Extended Coverage"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Description *
                      </label>
                      <Textarea
                        value={service.description}
                        onChange={(e) => handleExtraServiceChange(index, 'description', e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                        placeholder="e.g., Additional 2 hours of photography"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Price (₹) *
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="number"
                          value={service.price || ''}
                          onChange={(e) => handleExtraServiceChange(index, 'price', Number(e.target.value))}
                          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {offerData.extraServices.length === 0 && (
              <p className="text-xs text-gray-500 mt-2">Click "Add Service" to add extra services</p>
            )}
          </div>

          {/* Notes (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes (Optional)
            </label>
            <Textarea
              value={offerData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              placeholder="Any additional information or terms..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 flex-shrink-0">
          <Button
            variant="muted"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2"
          >
            {isSubmitting 
              ? (existingOffer ? 'Updating...' : 'Submitting...') 
              : (existingOffer ? 'Update Offer' : 'Submit Offer')}
          </Button>
        </div>
      </div>
    </div>
  );
};

