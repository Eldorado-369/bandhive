import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { CheckCircle, XCircle, Eye } from 'lucide-react';

const PendingVerifications = () => {
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [selectedBand, setSelectedBand] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingVerifications();
  }, []);

  const fetchPendingVerifications = async () => {
    try {
      const response = await axios.get("/api/pending-verifications/");
      setPendingVerifications(response.data);
    } catch (error) {
      console.error("Error fetching pending verifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (bandId, status) => {
    try {
      await axios.post(`/api/update-verification/${bandId}/`, { status });
      fetchPendingVerifications();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error updating verification status:", error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold">Pending Verifications</h2>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : pendingVerifications.length === 0 ? (
            <div className="text-center py-4">No pending verifications</div>
          ) : (
            <div className="space-y-4">
              {pendingVerifications.map((band) => (
                <div key={band.id} className="border rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{band.name}</h3>
                    <p className="text-sm text-gray-600">
                      Band - {band.genre}
                    </p>
                    <p className="text-sm text-gray-500">
                      Applied: {formatDate(band.applied_date)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleStatusUpdate(band.id, 1)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleStatusUpdate(band.id, -1)}
                      variant="destructive"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedBand(band);
                        setIsModalOpen(true);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        {selectedBand && (
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedBand.name} - Verification Details</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div>
                <h4 className="font-semibold">Contact Information</h4>
                <p>Email: {selectedBand.user_email}</p>
                <p>Phone: {selectedBand.user_phone}</p>
                <p>Location: {selectedBand.location}</p>
              </div>
              <div>
                <h4 className="font-semibold">Band Details</h4>
                <p>Genre: {selectedBand.genre}</p>
                <p>Members: {selectedBand.member_count}</p>
                <p>Base Price: ${selectedBand.base_price}</p>
              </div>
              <div className="col-span-2">
                <h4 className="font-semibold">Description</h4>
                <p>{selectedBand.description}</p>
              </div>
              {selectedBand.verification_image && (
                <div className="col-span-2">
                  <h4 className="font-semibold">Verification Document</h4>
                  <p>Type: {selectedBand.document_type}</p>
                  <img 
                    src={selectedBand.verification_image} 
                    alt="Verification Document"
                    className="mt-2 max-h-64 object-contain"
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Close
              </Button>
              <Button
                onClick={() => handleStatusUpdate(selectedBand.id, 1)}
                className="bg-green-600 hover:bg-green-700"
              >
                Approve
              </Button>
              <Button
                onClick={() => handleStatusUpdate(selectedBand.id, -1)}
                variant="destructive"
              >
                Reject
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};

export default PendingVerifications;