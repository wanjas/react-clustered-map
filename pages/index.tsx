import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import { GoogleMap, ReactMarker } from '../lib';

import markers from './sample_markers.json';

const MK = React.memo<{ marker: ReactMarker }>(function MK({ marker }) {
  const [color, setColor] = useState('yellow');
  const title = marker?.meta?.isCluster
    ? marker.meta.markers?.length || 0
    : `ID: ${marker.id}`;
  return (
    <div style={{ background: color }} onMouseEnter={() => setColor('blue')}>
      {title}
    </div>
  );
});

const Index = React.memo(function Index(props) {
  const [visible, setVisible] = useState(false);
  useEffect(() => setVisible(true), []);

  if (!visible) {
    return null;
  }

  return (
    <div style={{ padding: 100 }}>
      <GoogleMap
        apiKey={process.env.NEXT_PUBLIC_GOOGLE_API_KEY_CLIENT as string}
        // markers={[
        //   {
        //     id: '1',
        //     location: { lat: 35.6290557606952, lng: 139.7383863278081 },
        //   },
        // ]}
        markers={_.take(markers, 100000) as any}
        MarkerComponent={MK}
      />
    </div>
  );
});

export default Index;
