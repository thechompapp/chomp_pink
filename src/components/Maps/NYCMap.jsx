/* src/components/Maps/NYCMap.jsx */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import * as stringSimilarity from 'string-similarity';
import neighborhoodBoundariesData from '@/data/nyc-neighborhoods.json';
import { logError, logInfo, logDebug } from '@/utils/logger';
import { usePlacesApi } from '@/contexts/PlacesApiContext';

const NYCMap = ({ neighborhoods, onNeighborhoodClick, selectedNeighborhoodId }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [mapError, setMapError] = useState(null);
  const { isLoaded: isMapLoaded, google } = usePlacesApi();

  // Define NYC center coordinates
  const nycCenter = useMemo(() => ({ lat: 40.7505, lng: -73.9934 }), []);

  // === Map Initializer ===
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current || mapInstance.current) {
      return;
    }

    logInfo('[NYCMap] Initializing Google Map...');
    try {
      mapInstance.current = new google.maps.Map(mapRef.current, {
        center: nycCenter,
        zoom: 11,
        mapId: import.meta.env.VITE_GOOGLE_MAP_ID_STYLE_1,
        disableDefaultUI: true,
        zoomControl: true,
        clickableIcons: false,
        gestureHandling: 'greedy',
      });
    } catch (error) {
      logError('[NYCMap] Map initialization failed', error);
      setMapError('Failed to load the map. Please try refreshing the page.');
    }
  }, [isMapLoaded, google, nycCenter]);


  // === GeoJSON Layer and Boundary Logic ===
  useEffect(() => {
    if (!mapInstance.current || !google || !neighborhoods || neighborhoods.length === 0) {
      return;
    }

    // Deep clone and sanitize GeoJSON data to fix invalid polygons before loading
    const sanitizedGeoJson = JSON.parse(JSON.stringify(neighborhoodBoundariesData));
    sanitizedGeoJson.features.forEach(feature => {
      if (!feature.geometry || !feature.geometry.coordinates) return;

      const closeRing = (ring) => {
        if (!ring || ring.length < 3) return; // A valid ring needs at least 3 points
        const first = ring[0];
        const last = ring[ring.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) {
          logDebug(`[NYCMap] Auto-closing unclosed polygon ring for: ${feature.properties?.name || 'N/A'}`);
          ring.push(first);
        }
      };

      if (feature.geometry.type === 'Polygon') {
        feature.geometry.coordinates.forEach(closeRing);
      } else if (feature.geometry.type === 'MultiPolygon') {
        feature.geometry.coordinates.forEach(polygon => polygon.forEach(closeRing));
      }
    });

    logInfo(`[NYCMap] Processing ${sanitizedGeoJson.features.length} GeoJSON features to match against ${neighborhoods.length} DB neighborhoods.`);

    const dbNeighborhoodNames = neighborhoods.map(n => n.name);

    // Clear existing features before redrawing
    mapInstance.current.data.forEach(feature => {
      mapInstance.current.data.remove(feature);
    });

    const dataFeatures = mapInstance.current.data.addGeoJson(sanitizedGeoJson, { idPropertyName: 'name' });

    let matchedCount = 0;
    dataFeatures.forEach(feature => {
      const geoName = feature.getProperty('name');
      if (!geoName) {
        feature.setProperty('visible', false);
        return;
      }

      const { bestMatch } = stringSimilarity.findBestMatch(geoName, dbNeighborhoodNames);
      
      const SIMILARITY_THRESHOLD = 0.5;

      if (bestMatch && bestMatch.rating >= SIMILARITY_THRESHOLD) {
        const dbNeighborhood = neighborhoods.find(n => n.name === bestMatch.target);
        if (dbNeighborhood) {
          feature.setProperty('dbData', {
            id: dbNeighborhood.id,
            name: dbNeighborhood.name,
            restaurantCount: dbNeighborhood.restaurant_count,
            parentId: dbNeighborhood.parent_id,
          });
          feature.setProperty('visible', true);
          matchedCount++;
        } else {
           feature.setProperty('visible', false);
        }
      } else {
        feature.setProperty('visible', false);
      }
    });

    logInfo(`[NYCMap] Matched ${matchedCount} neighborhoods to GeoJSON features.`);

  }, [mapInstance.current, google, neighborhoods]);

  // === Map Styling ===
  useEffect(() => {
    if (!mapInstance.current) return;

    mapInstance.current.data.setStyle(feature => {
      const { dbData, visible } = Object.fromEntries(
        ['dbData', 'visible'].map(p => [p, feature.getProperty(p)])
      );
      
      if (!visible || !dbData) {
        return { visible: false };
      }
      
      const isSelected = selectedNeighborhoodId === dbData.id;
      const restaurantCount = parseInt(dbData.restaurantCount, 10) || 0;
      
      const getIntensity = (count) => {
        if (count === 0) return 0.1;
        if (count < 10) return 0.3;
        if (count < 50) return 0.5;
        return 0.7;
      };

      return {
        visible: true,
        fillColor: isSelected ? '#FF00A8' : '#3B82F6',
        fillOpacity: getIntensity(restaurantCount),
        strokeColor: isSelected ? '#FF00A8' : '#1E40AF',
        strokeWeight: isSelected ? 2 : 1,
        zIndex: isSelected ? 1 : 0,
      };
    });
  }, [mapInstance.current, selectedNeighborhoodId]);


  // === Map Event Listeners ===
  useEffect(() => {
    if (!mapInstance.current || !onNeighborhoodClick) return;

    const clickListener = mapInstance.current.data.addListener('click', (event) => {
      const dbData = event.feature.getProperty('dbData');
      if (dbData && dbData.id) {
        onNeighborhoodClick(dbData.id);
      }
    });

    return () => {
      google.maps.event.removeListener(clickListener);
    };
  }, [mapInstance.current, google, onNeighborhoodClick]);

  if (mapError) {
    return (
      <div className="flex items-center justify-center h-full bg-red-100 text-red-700">
        <p>⚠️ {mapError}</p>
      </div>
    );
  }

  return <div ref={mapRef} className="w-full h-full" />;
};

NYCMap.propTypes = {
  neighborhoods: PropTypes.array.isRequired,
  onNeighborhoodClick: PropTypes.func,
  selectedNeighborhoodId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default NYCMap;