// src/components/GeocoderControl.tsx

import { useControl } from "react-map-gl";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import type { GeocoderOptions } from "@mapbox/mapbox-gl-geocoder";

// Import the Mapbox Geocoder CSS for styling
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";

// Define the props for our React component
type GeocoderControlProps = Omit<
  GeocoderOptions,
  "accessToken" | "mapboxgl" // We omit these because our component will manage them
> & {
  mapboxAccessToken: string; // The required Mapbox API token
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right"; // Map position
  onResult?: (e: any) => void; // Optional callback for when a user selects a result
  onClear?: () => void; // Optional callback for when the input is cleared
};

/**
 * A React wrapper component that integrates the Mapbox GL Geocoder
 * control into a react-map-gl map instance using the `useControl` hook.
 */
export default function GeocoderControl({
  mapboxAccessToken,
  position,
  ...props
}: GeocoderControlProps) {
  // The useControl hook manages adding and removing the Mapbox control to the map
  useControl<MapboxGeocoder>(
    () => {
      // Create a new instance of the MapboxGeocoder control
      const ctrl = new MapboxGeocoder({
        ...props, // Pass down all other options (like proximity, country, etc.)
        marker: false, // We'll handle markers ourselves, so disable the default
        accessToken: mapboxAccessToken,
      });

      // Attach event listeners if the props were passed in
      if (props.onResult) ctrl.on("result", props.onResult);
      if (props.onClear) ctrl.on("clear", props.onClear);

      return ctrl;
    },
    {
      // Define where on the map the control should be placed
      position: position,
    }
  );

  // The component itself doesn't render any React elements,
  // as its only job is to imperatively add the control to the map.
  return null;
}
