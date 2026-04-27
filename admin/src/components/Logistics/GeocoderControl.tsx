import { useControl } from "react-map-gl";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import mapboxgl from "mapbox-gl";
import type { GeocoderOptions } from "@mapbox/mapbox-gl-geocoder";

// Import CSS for the search bar to look correct
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";

type GeocoderControlProps = Omit<
  GeocoderOptions,
  "accessToken" | "mapboxgl"
> & {
  mapboxAccessToken: string;
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  onResult?: (e: any) => void;
  onClear?: () => void;
  onLoading?: (e: any) => void;
  onError?: (e: any) => void;
};

export default function GeocoderControl({
  mapboxAccessToken,
  position,
  ...props
}: GeocoderControlProps) {
  // We use "any" here because MapboxGeocoder's internal 'map' type
  // often conflicts with react-map-gl's MapInstance type
  useControl<any>(
    () => {
      const ctrl = new MapboxGeocoder({
        ...props,
        marker: false, // We usually handle markers manually in React
        accessToken: mapboxAccessToken,
        mapboxgl: mapboxgl,
      });

      // Event Listeners
      if (props.onResult) ctrl.on("result", props.onResult);
      if (props.onClear) ctrl.on("clear", props.onClear);
      if (props.onLoading) ctrl.on("loading", props.onLoading);
      if (props.onError) ctrl.on("error", props.onError);

      return ctrl;
    },
    {
      position: position,
    },
  );

  return null;
}
