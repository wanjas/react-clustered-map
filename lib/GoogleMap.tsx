import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import _ from 'lodash';
import { useScript } from './useScript';
import { MapOverlay, Overlay } from './MapOverlay';
import {
  MarkerComponentType,
  MarkerEventHandler,
  ReactMarker,
  ReactMarkerComponent,
} from './ReactMarker';
import { MapContext } from './MapContext';
import { BoundariesAsArray, useVisibleMarkers } from './useVisibleMarkers';

export type GoogleMapLibrary =
  | 'drawing'
  | 'geometry'
  | 'places'
  | 'visualization';

export type BoundsChangeEvent = {
  bounds: google.maps.LatLngBounds;
  center: google.maps.LatLng;
  zoom: number;
};
export type BoundsChangeHandler = (
  event: BoundsChangeEvent,
  map: google.maps.Map,
) => void;

export type VisibleMarkersChangeEvent = {
  markers: ReactMarker[];
};
export type VisibleMarkersChangeHandler = (
  event: VisibleMarkersChangeEvent,
  // map: google.maps.Map,
) => void;

export type SpinnerComponentType = React.ComponentType<any>;

export type GoogleMapProps = {
  [Library in GoogleMapLibrary]?: boolean;
} & {
  markers: ReactMarker<any>[];
  MarkerComponent: MarkerComponentType;
  ClusterComponent?: MarkerComponentType;
  SpinnerComponent?: SpinnerComponentType;
  onMarkerClick?: MarkerEventHandler;
  onMarkerMouseEnter?: MarkerEventHandler;
  onMarkerMouseLeave?: MarkerEventHandler;
  wrapperStyle?: React.CSSProperties;
  wrapperClassName?: string;
  onBoundsChange?: BoundsChangeHandler;
  onVisibleMarkersChange?: VisibleMarkersChangeHandler;
  isLoading?: boolean;
};

export type GoogleMapApiProps = {
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
  wrapperStyle = { width: 700, height: 700 },
  wrapperClassName = 'rcm-map-wrapper',
  onBoundsChange,
  onVisibleMarkersChange,
  isLoading = false,
  SpinnerComponent,
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
    (value: google.maps.LatLngBounds, newDrawCount: number) => {
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
      setDrawCount(newDrawCount);
    },
    [mapBoundaries, setMapBoundariesState, setDrawCount],
  );

  const debouncedBounce = useCallback(
    _.debounce((mapObject: google.maps.Map<HTMLInputElement>) => {
      if (onBoundsChange) {
        const bounds = mapObject.getBounds();
        const center = mapObject.getCenter();
        const zoom = mapObject.getZoom();
        if (bounds) {
          onBoundsChange({ bounds, center, zoom }, mapObject);
        }
      }
    }, 1000),
    [onBoundsChange],
  );

  useEffect(() => {
    if (wrapperRef.current) {
      const mapObject = new mapsAPI.Map(wrapperRef.current, {
        zoom: 14,
        center: mapCenter,
        minZoom: 14,
        fullscreenControl: false,
        mapTypeControl: false,
        streetViewControl: false,
        zoomControl: true,
        zoomControlOptions: {
          position: google.maps.ControlPosition.TOP_RIGHT,
        },
        clickableIcons: false,
        gestureHandling: 'greedy',
        // mapTypeId: google.maps.MapTypeId.ROADMAP,
      });
      mapObject.addListener('click', (e) => {
        console.log(e);
        e.stop();
      });
      mapObject.addListener('bounds_changed', () => {
        console.log('BOUNDS!');
        debouncedBounce(mapObject);
      });
      setMap(mapObject);
    }
  }, [mapCenter, debouncedBounce]);

  const setMapBoundariesRef = useRef<typeof setMapBoundaries>(setMapBoundaries);
  setMapBoundariesRef.current = setMapBoundaries;

  useEffect(() => {
    if (map && portalRef.current) {
      const layer = new mapsAPI.OverlayView();
      const newOverlay = new Overlay(
        layer,
        portalRef.current,
        setMapBoundariesRef,
      );
      layer.setMap(map);
      setOverlay(newOverlay);
    }
  }, [map, portalRef.current]);

  const wrapper = useMemo(
    () => (
      <div ref={wrapperRef} style={wrapperStyle} className={wrapperClassName} />
    ),
    [],
  );

  const visibleMarkers = useVisibleMarkers(
    markers,
    mapBoundaries,
    wrapperRef.current?.offsetWidth || 0,
  );

  useEffect(() => {
    if (onVisibleMarkersChange) {
      onVisibleMarkersChange({ markers: visibleMarkers });
    }
  }, [visibleMarkers]);

  // const RootDiv = root.div as React.ComponentType<{ mode: string }>;
  const portal = useMemo(
    () => (
      <MapOverlay ref={portalRef}>
        {visibleMarkers.map((m) => (
          <ReactMarkerComponent
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
    <React.Fragment>
      <MapContext.Provider value={mapContextValue}>
        {wrapper}
        <div style={{ display: 'none' }}>{portal}</div>
      </MapContext.Provider>

      {/* <div> */}
      {/*  lat: {mapCenter.lat} ; lng: {mapCenter.lng} */}
      {/* </div> */}
      {/* <div>boundaries: {JSON.stringify(mapBoundaries)}</div> */}
      {isLoading && SpinnerComponent && <SpinnerComponent />}
    </React.Fragment>
  );
});

export const GoogleMap = React.memo<GoogleMapProps & GoogleMapApiProps>(
  function GoogleMap({ apiKey, version = 'weekly', ...mapProps }) {
    const mapURL = `https://maps.googleapis.com/maps/api/js?v=weekly&libraries=geometry,drawing,places&key=${apiKey}`;
    const status = useScript(mapURL);

    if (status !== 'ready' && !window.google?.maps) {
      return null;
    }

    return <GoogleMapPure {...mapProps} mapsAPI={window.google.maps} />;
  },
);
