import React, { useState } from 'react';

type SetMapBoundariesRef = {
  current: (boundaries: google.maps.LatLngBounds, drawCount: number) => void;
};

export class Overlay {
  ref: Element;

  layer: google.maps.OverlayView;

  setMapBoundariesRef: SetMapBoundariesRef;

  isDragged = false;

  constructor(
    layer: google.maps.OverlayView,
    ref: Element,
    setMapBoundariesRef: SetMapBoundariesRef,
  ) {
    this.ref = ref;
    this.layer = layer;
    this.setMapBoundariesRef = setMapBoundariesRef;

    layer.draw = this.draw;
    layer.onAdd = this.onAdd;
    layer.onRemove = this.onRemove;
  }

  onAdd = () => {
    const { overlayMouseTarget } = this.layer.getPanes();

    overlayMouseTarget.appendChild(this.ref);

    const map = this.layer.getMap();
    map.addListener('dragstart', () => {
      console.log('Drag start');
      this.isDragged = true;
    });
    map.addListener('dragend', () => {
      console.log('Drag end');
      this.isDragged = false;
    });
  };

  drawCount = 0;

  draw = () => {
    // super.draw();

    // console.log([map.getCenter().lng(), map.getCenter().lat()]);
    // console.log(
    //   this.layer.getProjection().fromLatLngToDivPixel(map.getCenter()),
    // );
    this.drawCount += 1;
    if (!this.isDragged) {
      console.log(`Draw!: ${this.drawCount}`);

      const map = this.layer.getMap() as google.maps.Map;
      console.log(`Draw bound: ${map.getBounds()?.getSouthWest().lat()}`);
      this.setMapBoundariesRef.current(
        map.getBounds() as google.maps.LatLngBounds,
        this.drawCount,
      );
    }
  };

  // draw = _.debounce(this.drawFn, 50);

  onRemove = () => {
    // super.onRemove();
  };

  fromLatLngToDivPixel(location: google.maps.LatLng): google.maps.Point {
    return this.layer.getProjection()?.fromLatLngToDivPixel(location);
  }
}

export const MapOverlay = React.forwardRef<
  HTMLDivElement,
  React.PropsWithChildren<any>
>(function MapOverlay({ children }, ref) {
  const [count, setCount] = useState(1);

  return (
    <div
      ref={ref}
      className="portal"
      style={{
        background: 'transparent',
        position: 'static',
        width: 10,
        height: 10,
      }}
      onClick={(e) => {
        e.stopPropagation();
        setCount(count + 1);
      }}
    >
      {children}
    </div>
  );
});
