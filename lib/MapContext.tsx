import React from 'react';
import { BoundariesAsArray } from './useVisibleMarkers';

interface MapContextValue {
  // center: google.maps.ReadonlyLatLngLiteral | null;
  boundaries: BoundariesAsArray | null;
  drawCount: number;
}

export const MapContext = React.createContext<MapContextValue>({
  boundaries: null,
  drawCount: 0,
});
