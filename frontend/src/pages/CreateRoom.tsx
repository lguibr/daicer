import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import PrivateLayout from '../components/layout/PrivateLayout';
import { createRoom } from '../services/api';
import type { WorldSettings } from '@daicer/engine';

import { CampaignWizard } from '../features/create-room/components/CampaignWizard';

export default function CreateRoomPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (settings: WorldSettings) => {
    setLoading(true);
    try {
      const room = await createRoom({
        settings,
        structures: [], // Default empty structures
      });

      navigate(`/room/${room.documentId}`, {
        state: {
          initialSeed: settings.seed,
          initialStructures: [],
          initialSettings: settings,
        },
      });
    } catch (err) {
      console.error(err);
      alert('Failed to create room: ' + (err instanceof Error ? err.message : 'Unknown error'));
      setLoading(false);
    }
  };

  return (
    <PrivateLayout showNavbar>
      <div className="relative mx-auto min-h-screen max-w-6xl px-6 py-16 sm:px-10 lg:px-12">
        <CampaignWizard onSubmit={handleSubmit} onCancel={() => navigate('/')} isSubmitting={loading} />
      </div>
    </PrivateLayout>
  );
}
