import _ from 'lodash';
import { useMemo } from 'react';
import { ReactMarker } from './ReactMarker';
import { use2DTree } from './use2DTree';

export type BoundariesAsArray = [
  number, // minLat
  number, // minLng
  number, // maxLat
  number, // maxLng
];

export type ClusterOptions = {
  radiusInPixels: number;
};

function calculateMarkerRadius(
  radiusInPixels: number,
  mapWidth: number,
  boundaries: BoundariesAsArray,
): number {
  const widthGr = boundaries[3] - boundaries[1];

  return (radiusInPixels / mapWidth) * widthGr;
}

function createMarker(
  indexes: number[],
  allMarkers: ReactMarker[],
): ReactMarker {
  if (indexes.length === 1) {
    return allMarkers[indexes[0]];
  }

  const clusterMarkers = indexes.map((i) => allMarkers[i]);

  const location = {
    lat: _.mean(_.map(clusterMarkers, (m) => m.location.lat)),
    lng: _.mean(_.map(clusterMarkers, (m) => m.location.lng)),
  };

  return {
    id: `${location.lat}-${location.lng}-${clusterMarkers[0].id}`,
    location,
    meta: {
      isCluster: true,
      markers: clusterMarkers,
    },
  };
}

export function useVisibleMarkers(
  markers: ReactMarker[],
  boundaries: BoundariesAsArray | null,
  mapWidth: number,
  clusterOptions: ClusterOptions = { radiusInPixels: 100 },
) {
  const tree = use2DTree(markers);

  const markersInBounds = useMemo(() => {
    if (boundaries) {
      return tree.range(...boundaries).map((index) => markers[index]);
    }
    return [];
  }, [tree, markers, ...(boundaries || [0, 0, 0, 0])]);

  const visibleClusteredMarkers = useMemo(() => {
    if (boundaries && mapWidth) {
      const r = calculateMarkerRadius(
        clusterOptions.radiusInPixels,
        mapWidth,
        boundaries,
      );

      const processedMarkersIds: Record<string, boolean> = {};
      const visibleMarkers: ReactMarker[] = [];
      markersInBounds.forEach((marker) => {
        if (!processedMarkersIds[marker.id]) {
          let inRadiusIndexes = tree.within(
            marker.location.lat,
            marker.location.lng,
            r,
          );

          inRadiusIndexes = _.filter(
            inRadiusIndexes,
            (index) => !processedMarkersIds[markers[index].id],
          );

          inRadiusIndexes.forEach((i) => {
            processedMarkersIds[markers[i].id] = true;
          });

          visibleMarkers.push(createMarker(inRadiusIndexes, markers));
          processedMarkersIds[marker.id] = true;
        }
      });
      return visibleMarkers;
    }
    return [];
  }, [tree, clusterOptions.radiusInPixels, markersInBounds, mapWidth]);

  return visibleClusteredMarkers;
}
