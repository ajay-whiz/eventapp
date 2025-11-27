import React from 'react';
import { XCircle, Clock, DollarSign, Package, User } from 'lucide-react';

export interface ExtraService {
  name: string;
  description: string;
  price: number;
}

export interface VendorOffer {
  // API response fields
  offerId?: string;
  id?: string; // Support both offerId and id for backward compatibility
  bookingId?: string;
  userId?: string;
  userName?: string;
  offerAddedBy?: string;
  amount?: number; // API uses 'amount' not 'offerAmount'
  offerAmount?: number; // Keep for backward compatibility
  extraServices?: ExtraService[] | string[] | string; // Support array of objects, array of strings, or string
  notes?: string;
  status?: 'pending' | 'accepted' | 'rejected' | string;
  createdAt?: string;
  // Legacy fields for backward compatibility
  vendorId?: string;
  vendorName?: string;
}

interface OfferListProps {
  offers: VendorOffer[];
  bookingId: string;
  onAcceptOffer?: (offerId: string) => Promise<void>; // Make optional since we're removing actions
  loading?: boolean;
}

export const OfferList: React.FC<OfferListProps> = ({
  offers,
  bookingId,
  loading = false,
}) => {

  const getStatusConfig = (status: string | undefined | null) => {
    // Handle undefined, null, or empty status
    if (!status || typeof status !== 'string') {
      return {
        color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        icon: Clock,
        label: 'Pending',
      };
    }

    switch (status.toLowerCase()) {
      case 'accepted':
        return {
          color: 'bg-green-100 text-green-700 border-green-200',
          icon: CheckCircle,
          label: 'Accepted',
        };
      case 'rejected':
        return {
          color: 'bg-red-100 text-red-700 border-red-200',
          icon: XCircle,
          label: 'Rejected',
        };
      case 'pending':
      default:
        return {
          color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
          icon: Clock,
          label: 'Pending',
        };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
        <span className="ml-3 text-gray-600">Loading offers...</span>
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
        <p className="text-lg font-medium">No offers yet</p>
        <p className="text-sm">Vendors can submit offers for this booking</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Offer Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Extra Services
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {offers.map((offer) => {
                const statusConfig = getStatusConfig(offer.status);
                const StatusIcon = statusConfig.icon;
                
                // Get offer ID (support both offerId and id)
                const offerId = offer.offerId || offer.id || '';
                // Get vendor/user name (support both userName and vendorName)
                const vendorName = offer.userName || offer.vendorName || 'Unknown Vendor';
                // Get amount (support both amount and offerAmount)
                const amount = offer.amount || offer.offerAmount || 0;

                return (
                  <tr key={offerId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-sky-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-sky-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {vendorName}
                          </div>
                          {offer.offerAddedBy && (
                            <div className="text-xs text-gray-500">
                              Added by: {offer.offerAddedBy}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm font-semibold text-gray-900">
                        <DollarSign className="w-4 h-4 mr-1 text-green-600" />
                        ₹{amount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs">
                        {Array.isArray(offer.extraServices) ? (
                          <div className="space-y-1">
                            {offer.extraServices.map((service: any, idx: number) => {
                              // Handle array of objects (ExtraService)
                              if (typeof service === 'object' && service !== null) {
                                return (
                                  <div key={idx} className="border-l-2 border-sky-200 pl-2">
                                    <div className="font-medium">{service.name || 'Unnamed Service'}</div>
                                    <div className="text-xs text-gray-600">{service.description || 'No description'}</div>
                                    {service.price && service.price > 0 && (
                                      <div className="text-xs text-green-600 font-medium">
                                        ₹{service.price.toLocaleString()}
                                      </div>
                                    )}
                                  </div>
                                );
                              }
                              // Handle array of strings
                              return (
                                <div key={idx} className="border-l-2 border-sky-200 pl-2">
                                  <div className="text-sm">{service || 'No service name'}</div>
                                </div>
                              );
                            })}
                          </div>
                        ) : typeof offer.extraServices === 'string' ? (
                          <div className="truncate" title={offer.extraServices}>
                            {offer.extraServices}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">No extra services</span>
                        )}
                      </div>
                      {offer.notes && (
                        <div className="text-xs text-gray-500 mt-1 max-w-xs truncate" title={offer.notes}>
                          Note: {offer.notes}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {offer.createdAt ? new Date(offer.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

