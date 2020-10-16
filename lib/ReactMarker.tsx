import _ from 'lodash';
import React, { useCallback, useContext } from 'react';
import { MapContext } from './MapContext';
import { Overlay } from './MapOverlay';

export type ClusterMeta = {
  isCluster?: boolean;
  markers?: ReactMarker[];
};

export type ReactMarker<MetaType = ClusterMeta> = {
  id: string;
  location: google.maps.ReadonlyLatLngLiteral;
  meta?: MetaType & ClusterMeta;
  // options?: google.maps.MarkerOptions;
};

export type MarkerEventHandler = (
  marker: ReactMarker,
  map: google.maps.Map,
  mapsAPI: typeof google.maps,
) => void;

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

export const ReactMarkerComponent = React.memo<ReactMarkerProps>(
  function ReactMarkerComponent({
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

    const position = overlay?.fromLatLngToDivPixel(
      new mapsAPI.LatLng(marker.location),
    );

    // if (Math.abs(position.x) > 1000 || Math.abs(position.y) > 1000) {
    //   console.log('Faraway');
    //   return null;
    // }

    // console.log(`Position: ${position.x} - ${position.y}`);

    const drawClusterComponent = ClusterComponent && marker.meta?.isCluster;

    const onClickHandler = useCallback(() => {
      if (marker?.meta?.isCluster && map) {
        const lLng = _.min(_.map(marker.meta.markers, (m) => m.location.lng))!;
        const mLng = _.max(_.map(marker.meta.markers, (m) => m.location.lng))!;
        const lLat = _.min(_.map(marker.meta.markers, (m) => m.location.lat))!;
        const mLat = _.max(_.map(marker.meta.markers, (m) => m.location.lat))!;
        map.fitBounds({ east: mLng, west: lLng, north: mLat, south: lLat }, 50);
      }
      if (map) {
        console.log('click');
        onMarkerClick?.(marker, map, mapsAPI);
      }
    }, [onMarkerClick, marker, map, mapsAPI]);

    if (!position) {
      return null;
    }

    if (!map || !overlay) {
      return null;
    }

    return (
      <div
        style={{
          // background: 'blue',
          // width: 20,
          // height: 20,
          position: 'absolute',
          top: position.y,
          left: position.x,
          transform: 'translate(-50%, -100%)',
        }}
        onClick={onClickHandler}
        onMouseEnter={() => onMarkerMouseEnter?.(marker, map, mapsAPI)}
        onMouseLeave={() => onMarkerMouseLeave?.(marker, map, mapsAPI)}
      >
        {drawClusterComponent && !!ClusterComponent && (
          <ClusterComponent marker={marker} />
        )}
        {!drawClusterComponent && <MarkerComponent marker={marker} />}
      </div>
    );
  },
);
