import React, { useMemo } from 'react';
import KDBush from 'kdbush';
import { ReactMarker } from './ReactMarker';

export function use2DTree(markers: ReactMarker[]): KDBush<ReactMarker<any>> {
  const tree = useMemo(
    () =>
      new KDBush<ReactMarker>(
        markers,
        (point) => point.location.lat,
        (point) => point.location.lng,
      ),
    [markers],
  );
  return tree;
}
