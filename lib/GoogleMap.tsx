import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useScript } from './useScript';
import { MapOverlay, Overlay } from './MapOverlay';
import {
  MarkerComponentType,
  MarkerEventHandler,
  ReactMarker,
} from './ReactMarker';
import { MapContext } from './MapContext';
import _ from 'lodash';
import { BoundariesAsArray, useVisibleMarkers } from './useVisibleMarkers';

type GoogleMapLibrary = 'drawing' | 'geometry' | 'places' | 'visualization';

type GoogleMapProps = {
  [Library in GoogleMapLibrary]?: boolean;
} & {
  markers: ReactMarker[];
  MarkerComponent: MarkerComponentType;
  ClusterComponent?: MarkerComponentType;
  onMarkerClick?: MarkerEventHandler;
  onMarkerMouseEnter?: MarkerEventHandler;
  onMarkerMouseLeave?: MarkerEventHandler;
};

type GoogleMapApiProps = {
  apiKey: string;
  version?: 'weekly' | 'quarterly' | number;
};

const GoogleMapPure = React.memo<
  GoogleMapProps & { mapsAPI: typeof google.maps }
>(function GoogleMap({
  drawing = true,
  places = true,
  geometry = true,
  markers,
  mapsAPI,
  MarkerComponent,
  ClusterComponent,
  onMarkerClick,
  onMarkerMouseEnter,
  onMarkerMouseLeave,
}) {
  const wrapperRef = useRef<HTMLInputElement>(null);
  const portalRef = useRef<HTMLInputElement>(null);
  const [map, setMap] = useState<google.maps.Map>();
  const [overlay, setOverlay] = useState<Overlay>();

  const [drawCount, setDrawCountState] = useState<number>(0);
  const setDrawCount = useCallback(
    (value: number) => {
      setDrawCountState(value % Number.MAX_SAFE_INTEGER);
    },
    [setDrawCountState],
  );

  const [mapCenter] = useState({
    lat: 35.6228495,
    lng: 139.7229018,
  });

  const [
    mapBoundaries,
    setMapBoundariesState,
  ] = useState<BoundariesAsArray | null>(null);

  const mapContextValue = useMemo(
    () => ({ boundaries: mapBoundaries, drawCount }),
    [drawCount, ...(mapBoundaries || [0, 0, 0, 0])],
  );

  // const firstRun = useRef(true);
  // const setMapCenter = useCallback(
  //   (value: google.maps.LatLng) => {
  //     if (
  //       firstRun.current ||
  //       value.lng() !== mapCenter.lng ||
  //       value.lat() !== mapCenter.lat
  //     ) {
  //       firstRun.current = false;
  //       setMapCenterState({ lng: value.lng(), lat: value.lat() });
  //     }
  //   },
  //   [mapCenter, setMapCenterState],
  // );

  const setMapBoundaries = useCallback(
    (value: google.maps.LatLngBounds, drawCount: number) => {
      const sw = value.getSouthWest();
      const ne = value.getNorthEast();
      const newBoundaries: BoundariesAsArray = [
        _.min([sw.lat(), ne.lat()])!,
        _.min([sw.lng(), ne.lng()])!,
        _.max([sw.lat(), ne.lat()])!,
        _.max([sw.lng(), ne.lng()])!,
      ];

      if (!_.isEqual(newBoundaries, mapBoundaries)) {
        setMapBoundariesState(newBoundaries);
      }
      setDrawCount(drawCount);
    },
    [mapBoundaries, setMapBoundariesState],
  );

  useEffect(() => {
    if (wrapperRef.current) {
      const mapObject = new mapsAPI.Map(wrapperRef.current, {
        zoom: 14,
        center: mapCenter,
        // mapTypeId: google.maps.MapTypeId.ROADMAP,
      });
      mapObject.addListener('click', (e) => {
        console.log(e);
        e.stop();
      });
      setMap(mapObject);
    }
  }, []);

  const setMapBoundariesRef = useRef<typeof setMapBoundaries>(setMapBoundaries);
  setMapBoundariesRef.current = setMapBoundaries;

  useEffect(() => {
    if (map && portalRef.current) {
      const layer = new mapsAPI.OverlayView();
      const overlay = new Overlay(
        layer,
        portalRef.current,
        setMapBoundariesRef,
      );
      layer.setMap(map);
      setOverlay(overlay);
    }
  }, [map, portalRef.current]);

  const wrapper = useMemo(
    () => <div ref={wrapperRef} style={{ height: 700, width: 1000 }} />,
    [],
  );

  const visibleMarkers = useVisibleMarkers(
    markers,
    mapBoundaries,
    wrapperRef.current?.offsetWidth || 0,
  );

  // const RootDiv = root.div as React.ComponentType<{ mode: string }>;
  const portal = useMemo(
    () => (
      <MapOverlay ref={portalRef}>
        {visibleMarkers.map((m) => (
          <ReactMarker
            marker={m}
            key={`marker-${m.id}`}
            map={map}
            mapsAPI={mapsAPI}
            overlay={overlay}
            MarkerComponent={MarkerComponent}
            ClusterComponent={ClusterComponent}
            onMarkerClick={onMarkerClick}
            onMarkerMouseEnter={onMarkerMouseEnter}
            onMarkerMouseLeave={onMarkerMouseLeave}
          />
        ))}
      </MapOverlay>
    ),
    [
      visibleMarkers,
      map,
      overlay,
      drawCount,
      onMarkerClick,
      onMarkerMouseEnter,
      onMarkerMouseLeave,
    ],
  );

  return (
    <div>
      <MapContext.Provider value={mapContextValue}>
        {wrapper}
        <div style={{ display: 'none' }}>{portal}</div>
      </MapContext.Provider>

      <div>
        lat: {mapCenter.lat} ; lng: {mapCenter.lng}
      </div>
      <div>boundaries: {JSON.stringify(mapBoundaries)}</div>
    </div>
  );
});

export const GoogleMap = React.memo<GoogleMapProps & GoogleMapApiProps>(
  function GoogleMap({ apiKey, version = 'weekly', ...mapProps }) {
    const mapURL = `https://maps.googleapis.com/maps/api/js?v=weekly&libraries=geometry,drawing,places&key=${apiKey}`;
    const status = useScript(mapURL);

    if (status !== 'ready') {
      return null;
    }

    return <GoogleMapPure {...mapProps} mapsAPI={window.google.maps} />;
  },
);
