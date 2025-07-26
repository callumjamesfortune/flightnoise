import { useEffect, useState } from 'react';

const ClosestPlanes = () => {
  const [planes, setPlanes] = useState([]);

  const LAX = { lat: 33.9422, lon: -118.4036 };

  const haversine = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  useEffect(() => {
    const fetchPlanes = async () => {
      try {
        const res = await fetch(
          'https://opensky-network.org/api/states/all?lamin=33.5&lomin=-119&lamax=34.5&lomax=-117.5'
        );
        const data = await res.json();

        const filtered = data.states
          .filter(p => p[5] !== null && p[6] !== null)
          .map(p => ({
            icao: p[0],
            callsign: p[1]?.trim() || 'N/A',
            lat: p[6],
            lon: p[5],
            distance: haversine(LAX.lat, LAX.lon, p[6], p[5]),
            altitude: p[7],
            velocity: p[9],
          }))
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 6);

        setPlanes(filtered);
      } catch (err) {
        console.error('Failed to fetch planes:', err);
      }
    };

    fetchPlanes();
    const interval = setInterval(fetchPlanes, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-center mt-6">
      <h2 className="text-xl font-bold mb-2">Closest Planes to LAX</h2>
      {planes.length === 0 ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <ul className="space-y-1">
          {planes.map(p => (
            <li key={p.icao} className="text-sm text-gray-700">
              <strong>{p.callsign}</strong> • {p.distance.toFixed(1)} km away
              {p.altitude ? ` • ${Math.round(p.altitude)} m` : ''}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ClosestPlanes;
