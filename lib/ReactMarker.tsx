import React, { useCallback, useContext, useMemo } from 'react';
import { MapContext } from './MapContext';
import { Overlay } from './MapOverlay';

export type MarkerEventHandler = (
  marker: ReactMarker,
  map: google.maps.Map,
  mapsAPI: typeof google.maps,
) => void;

export interface ReactMarker {
  id: string;
  location: google.maps.ReadonlyLatLngLiteral;
  meta?: Record<'isCluster' | 'markers' | string, any>;
  // options?: google.maps.MarkerOptions;
}

export type MarkerComponentType = React.ComponentType<{ marker: ReactMarker }>;

interface ReactMarkerProps {
  marker: ReactMarker;
  map: google.maps.Map | undefined;
  mapsAPI: typeof google.maps;
  overlay: Overlay | undefined;
  MarkerComponent: MarkerComponentType;
  ClusterComponent?: MarkerComponentType;
  onMarkerClick?: MarkerEventHandler;
  onMarkerMouseEnter?: MarkerEventHandler;
  onMarkerMouseLeave?: MarkerEventHandler;
}

export const ReactMarker = React.memo<ReactMarkerProps>(function ReactMarker({
  map,
  marker,
  mapsAPI,
  overlay,
  MarkerComponent,
  ClusterComponent,
  onMarkerClick,
  onMarkerMouseEnter,
  onMarkerMouseLeave,
}) {
  const { boundaries } = useContext(MapContext);

  // const location = useMemo(() => {
  //   return new mapsAPI.LatLng(marker.location);
  // }, [marker.location, ...(boundaries || [])]);

  if (!map || !overlay) {
    return null;
  }

  const position = overlay.fromLatLngToDivPixel(
    new mapsAPI.LatLng(marker.location),
  );

  if (!position) {
    return null;
  }

  // if (Math.abs(position.x) > 1000 || Math.abs(position.y) > 1000) {
  //   console.log('Faraway');
  //   return null;
  // }

  // console.log(`Position: ${position.x} - ${position.y}`);

  return (
    <div
      style={{
        background: 'blue',
        // width: 20,
        // height: 20,
        position: 'absolute',
        top: position.y,
        left: position.x,
        transform: 'translate(-50%, -100%)',
      }}
      onClick={() => onMarkerClick?.(marker, map, mapsAPI)}
      onMouseEnter={() => onMarkerMouseEnter?.(marker, map, mapsAPI)}
      onMouseLeave={() => onMarkerMouseLeave?.(marker, map, mapsAPI)}
    >
      <MarkerComponent marker={marker} />
    </div>
  );
});
