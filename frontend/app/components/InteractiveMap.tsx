'use client';

import { useEffect, useRef, useState, useId } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface InteractiveMapProps {
  tiffUrl?: string; // Keep for backwards compatibility but not used
  imageUrl?: string;
  boundsUrl?: string;
  className?: string;
}

// Pre-defined bounds for the farm orthophoto (from farm-orthophoto-bounds.json)
const DEFAULT_BOUNDS = {
  south: 52.3899536868911,
  west: -7.77666599187889,
  north: 52.392574071823155,
  east: -7.772752069751027,
};

export default function InteractiveMap({
  imageUrl = '/farm-orthophoto.png',
  boundsUrl = '/farm-orthophoto-bounds.json',
  className = '',
}: InteractiveMapProps) {
  const mapId = useId();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const initializedRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Prevent double initialization
    if (!mapContainerRef.current) return;

    const container = mapContainerRef.current;

    // Check if Leaflet already initialized on this container
    if ((container as any)._leaflet_id) {
      // Clean up existing map first
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      // Clear the leaflet id from the container
      delete (container as any)._leaflet_id;
    }

    if (initializedRef.current) return;
    initializedRef.current = true;

    const initMap = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to load bounds from JSON, fallback to defaults
        let bounds = DEFAULT_BOUNDS;
        try {
          const response = await fetch(boundsUrl);
          if (response.ok) {
            bounds = await response.json();
          }
        } catch {
          console.warn('Could not load bounds, using defaults');
        }

        const imageBounds: L.LatLngBoundsExpression = [
          [bounds.south, bounds.west],
          [bounds.north, bounds.east],
        ];

        // Double-check container is still valid and not already initialized
        if (!mapContainerRef.current || (mapContainerRef.current as any)._leaflet_id) {
          return;
        }

        // Initialize map centered on the image bounds
        const map = L.map(container, {
          center: [(bounds.south + bounds.north) / 2, (bounds.west + bounds.east) / 2],
          zoom: 16,
          zoomControl: true,
          attributionControl: true,
          scrollWheelZoom: true,
          dragging: true,
          touchZoom: true,
          doubleClickZoom: true,
          boxZoom: true,
        });

        mapRef.current = map;

        // Add ESRI World Imagery (satellite) base layer
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
          maxZoom: 22,
        }).addTo(map);

        // Add the farm image as an overlay (on top of satellite)
        const imageOverlay = L.imageOverlay(imageUrl, imageBounds, {
          opacity: 1,
          interactive: true,
          zIndex: 1000,
        });

        imageOverlay.addTo(map);

        // Fit map to show the image
        map.fitBounds(imageBounds, { padding: [20, 20] });

        setLoading(false);
      } catch (err) {
        console.error('Error initializing map:', err);
        setError(err instanceof Error ? err.message : 'Failed to load map');
        setLoading(false);
      }
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      // Clear the leaflet id from the container to allow re-initialization
      if (mapContainerRef.current) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }
      initializedRef.current = false;
    };
  }, [imageUrl, boundsUrl]);

  return (
    <div className={`relative ${className}`} style={{ zIndex: 0 }}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            <span className="text-gray-600">Loading map...</span>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 rounded-lg z-10">
          <div className="text-center p-4">
            <p className="text-red-600 font-medium">Error loading map</p>
            <p className="text-red-500 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}
      <div
        ref={mapContainerRef}
        className="w-full h-full rounded-lg"
        style={{ minHeight: '450px' }}
      />
    </div>
  );
}
