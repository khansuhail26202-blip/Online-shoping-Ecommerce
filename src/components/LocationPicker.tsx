import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Loader2, Search, Crosshair } from 'lucide-react';

export interface StructuredAddress {
  street: string;
  city: string;
  postal: string;
  fullAddress: string;
}

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number, address: StructuredAddress) => void;
  initialLat?: number;
  initialLng?: number;
}

export function LocationPicker({ onLocationSelect, initialLat, initialLng }: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [selectedLat, setSelectedLat] = useState<number | null>(initialLat ?? null);
  const [selectedLng, setSelectedLng] = useState<number | null>(initialLng ?? null);
  const [addressLabel, setAddressLabel] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  const customIcon = L.divIcon({
    className: 'custom-map-pin',
    html: `<div style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;background:#1168b0;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,0.3);border:2px solid white;"><div style="width:10px;height:10px;background:white;border-radius:50%;transform:rotate(45deg);"></div></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  });

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const startLat = initialLat ?? 20.5937;
    const startLng = initialLng ?? 78.9629;

    const map = L.map(mapRef.current, {
      center: [startLat, startLng],
      zoom: 5,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstance.current = map;

    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      placeMarker(lat, lng);
    });

    return () => {
      map.remove();
      mapInstance.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const placeMarker = async (lat: number, lng: number) => {
    setSelectedLat(lat);
    setSelectedLng(lng);

    if (mapInstance.current) {
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng], { icon: customIcon }).addTo(mapInstance.current);
      }
      mapInstance.current.setView([lat, lng], 15);
    }

    setGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (res.ok) {
        const data = await res.json();
        const a = data.address || {};
        const fullAddress: string = data.display_name || '';

        // PIN: try address.postcode first, then scan display_name for a 6-digit code
        const pin: string = a.postcode || (fullAddress.match(/\b(\d{6})\b/)?.[1] ?? '');

        // City: try every known Nominatim field, then fall back to parsing display_name
        const cityCandidates = [
          a.city, a.town, a.village, a.municipality,
          a.city_district, a.district, a.county, a.state_district,
        ].filter(Boolean);
        let cityName = cityCandidates[0] ?? '';

        // Street: house + building + road + area, but NOT the city or PIN
        const road = a.road || a.pedestrian || a.footway || a.path || '';
        const house = a.house_number || '';
        const building = a.building || '';
        const area = a.suburb || a.colony || a.locality || a.neighbourhood || '';
        let streetParts = [house, building, road, area].filter(Boolean);
        // Remove any part that is the city name or the PIN code
        streetParts = streetParts.filter(
          (p) => p !== cityName && p !== pin && !p.match(/^\d{6}$/)
        );
        let street = streetParts.join(', ');

        // If we still have no city, parse display_name (comma-separated, city is usually 3rd-4th part)
        if (!cityName && fullAddress) {
          const parts = fullAddress.split(',').map((s) => s.trim());
          // City is typically the part just before the state/PIN
          for (let i = parts.length - 2; i >= 0; i--) {
            const p = parts[i].replace(/\b\d{6}\b/, '').trim();
            if (p && p.length > 2 && !p.match(/^\d+$/) && !street.includes(p)) {
              cityName = p;
              break;
            }
          }
        }

        // If street is still empty, use the first 2 parts of display_name (minus city & PIN)
        if (!street && fullAddress) {
          const parts = fullAddress.split(',').map((s) => s.trim());
          street = parts
            .slice(0, 2)
            .filter((p) => p !== cityName && !p.match(/^\d{6}$/))
            .join(', ');
        }

        const structured: StructuredAddress = {
          street,
          city: cityName,
          postal: pin,
          fullAddress,
        };
        setAddressLabel(fullAddress || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        onLocationSelect(lat, lng, structured);
      } else {
        const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        setAddressLabel(fallback);
        onLocationSelect(lat, lng, { street: '', city: '', postal: '', fullAddress: fallback });
      }
    } catch {
      const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setAddressLabel(fallback);
      onLocationSelect(lat, lng, { street: '', city: '', postal: '', fullAddress: fallback });
    } finally {
      setGeocoding(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const { lat, lon, display_name } = data[0];
          placeMarker(parseFloat(lat), parseFloat(lon));
          setAddressLabel(display_name);
        }
      }
    } catch {
      // ignore
    } finally {
      setSearching(false);
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setGeocoding(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        placeMarker(latitude, longitude);
      },
      () => {
        setGeocoding(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={2} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); } }}
            placeholder="Search for an area, street, or landmark…"
            className="w-full pl-9 pr-3 py-2.5 rounded-md border border-slate-300 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1168b0] focus:ring-1 focus:ring-[#1168b0] transition-colors"
          />
        </div>
        <button
          type="button"
          onClick={handleSearch}
          disabled={searching}
          className="px-4 py-2.5 rounded-md bg-[#1168b0] text-white text-sm font-semibold hover:bg-[#0d5290] transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0"
        >
          {searching ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} /> : <Search className="w-4 h-4" strokeWidth={2} />}
          Search
        </button>
      </div>

      {/* Map container */}
      <div
        ref={mapRef}
        className="w-full h-64 rounded-lg border border-slate-300 overflow-hidden z-0"
        style={{ background: '#e5e7eb' }}
      />

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={useMyLocation}
          disabled={geocoding}
          className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold text-[#1168b0] bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors disabled:opacity-50"
        >
          {geocoding ? <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} /> : <Crosshair className="w-3.5 h-3.5" strokeWidth={2} />}
          Use my current location
        </button>
        <p className="text-xs text-slate-400">Or click anywhere on the map to pin your delivery spot</p>
      </div>

      {/* Selected location display */}
      {selectedLat !== null && selectedLng !== null && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-blue-50 border border-blue-200">
          <MapPin className="w-4 h-4 text-[#1168b0] mt-0.5 shrink-0" strokeWidth={2} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-700">Selected delivery location</p>
            {geocoding ? (
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" strokeWidth={2} /> Getting address…
              </p>
            ) : (
              <p className="text-xs text-slate-500 mt-0.5 break-words">{addressLabel || `${selectedLat.toFixed(5)}, ${selectedLng.toFixed(5)}`}</p>
            )}
            <p className="text-[11px] text-slate-400 mt-0.5">
              {selectedLat.toFixed(6)}, {selectedLng.toFixed(6)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
