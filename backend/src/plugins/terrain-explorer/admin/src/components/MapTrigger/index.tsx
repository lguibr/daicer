import React, { useEffect } from 'react';
import { Button } from '@strapi/design-system';
import { PuzzlePiece } from '@strapi/icons';
import { unstable_useDocument as useDocument } from '@strapi/content-manager/strapi-admin';
import { useParams } from 'react-router-dom';
import MapModal from '../MapModal';

const MapTrigger = () => {
  const { slug, id } = useParams<{ slug: string; id: string }>();
  const [showModal, setShowModal] = React.useState(false);

  // @ts-ignore
  const { document } = useDocument({
    model: slug || '',
    collectionType: 'collection-types',
    documentId: id || '',
  });

  // Ensure we are on the correct model
  if (slug !== 'api::room.room') {
    return null;
  }

  const roomData = document;
  console.log('[Terrain Explorer] Room Data:', roomData);

  return (
    <>
      <Button variant="secondary" startIcon={<PuzzlePiece />} onClick={() => setShowModal(true)}>
        Terrain Explorer
      </Button>

      {showModal && <MapModal onClose={() => setShowModal(false)} roomData={roomData} />}
    </>
  );
};

export default MapTrigger;
