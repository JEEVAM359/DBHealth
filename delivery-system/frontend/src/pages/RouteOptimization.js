import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';
import Navbar from '../components/Navbar';

function RoutingMachine({ start, end, onRouteFound }) {
  const map = useMap();
  const routingControlRef = useRef(null);

  useEffect(() => {
    if (!map || !start || !end) return;

    if (routingControlRef.current) {
      try {
        routingControlRef.current.getPlan().setWaypoints([]);
        map.removeControl(routingControlRef.current);
      } catch (e) {
        console.log('Cleanup error:', e);
      }
      routingControlRef.current = null;
    }

    setTimeout(() => {
      try {
        routingControlRef.current = L.Routing.control({
          waypoints: [
            L.latLng(start[0], start[1]),
            L.latLng(end[0], end[1])
          ],
          routeWhileDragging: false,
          lineOptions: {
            styles: [{ color: '#0066FF', weight: 6, opacity: 0.8 }]
          },
          show: false,
          addWaypoints: false,
          draggableWaypoints: false,
          fitSelectedRoutes: true,
          showAlternatives: false,
          createMarker: () => null
        }).addTo(map);

        routingControlRef.current.on('routesfound', function(e) {
          const routes = e.routes;
          const summary = routes[0].summary;
          const distanceKm = (summary.totalDistance / 1000).toFixed(2);
          const timeMin = Math.round(summary.totalTime / 60);
          
          onRouteFound({
            distance: distanceKm,
            time: timeMin
          });
        });
      } catch (e) {
        console.log('Routing error:', e);
      }
    }, 200);

    return () => {
      if (routingControlRef.current) {
        try {
          routingControlRef.current.getPlan().setWaypoints([]);
          map.removeControl(routingControlRef.current);
        } catch (e) {
          console.log('Cleanup error:', e);
        }
        routingControlRef.current = null;
      }
    };
  }, [map, start, end, onRouteFound]);

  return null;
}

function RouteOptimization() {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [result, setResult] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [startSuggestions, setStartSuggestions] = useState([]);
  const [showStartSuggestions, setShowStartSuggestions] = useState(false);
  const [startCoords, setStartCoords] = useState(null);
  const [endCoords, setEndCoords] = useState(null);
  const [showRoute, setShowRoute] = useState(false);
  const [calculating, setCalculating] = useState(false);

  const startIcon = L.divIcon({
    html: '<div style="font-size: 30px; color: #00AA00;">➤</div>',
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });

  const endIcon = L.icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCAzMCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTUgMEMxMC4wMjk0IDAgNiA0LjAyOTQgNiA5QzYgMTUuNzUgMTUgMjggMTUgMjhDMTUgMjggMjQgMTUuNzUgMjQgOUMyNCA0LjAyOTQgMTkuOTcwNiAwIDE1IDBaIiBmaWxsPSIjRkYwMDAwIi8+PGNpcmNsZSBjeD0iMTUiIGN5PSI5IiByPSI0IiBmaWxsPSJ3aGl0ZSIvPjwvc3ZnPg==',
    iconSize: [30, 40],
    iconAnchor: [15, 40],
    popupAnchor: [0, -40]
  });

  const locationCoords = {
    'Kuniyamuthur, Coimbatore': [10.9617, 76.9553],
    'RS Puram, Coimbatore': [11.0168, 76.9558],
    'Gandhipuram, Coimbatore': [11.0168, 76.9674],
    'Saibaba Colony, Coimbatore': [11.0248, 76.9547],
    'Peelamedu, Coimbatore': [11.0271, 76.9969],
    'Singanallur, Coimbatore': [11.0018, 77.0206],
    'Ganapathy, Coimbatore': [11.0446, 76.9718],
    'Saravanampatti, Coimbatore': [11.0777, 77.0003],
    'PSG College of Technology, Coimbatore': [11.0250, 76.9450],
    'Coimbatore Institute of Technology, Coimbatore': [11.0183, 76.9350],
    'Amrita Vishwa Vidyapeetham, Coimbatore': [10.9020, 76.9020],
    'Karunya Institute of Technology, Coimbatore': [10.9350, 76.7350],
    'PSGR Krishnammal College for Women, Coimbatore': [11.0200, 76.9500],
    'Hindusthan College of Engineering, Coimbatore': [11.0100, 76.9600],
    'SNS College of Technology, Coimbatore': [11.0800, 77.0400],
    'Kumaraguru College of Technology, Coimbatore': [11.0150, 76.9550],
    'Sri Krishna College of Engineering, Coimbatore': [11.0350, 76.9650],
    'Karpagam Academy of Higher Education, Coimbatore': [10.9800, 76.9900],
    'Dr NGP Institute of Technology, Coimbatore': [11.0400, 77.0100],
    'KGiSL Institute of Technology, Coimbatore': [11.0280, 76.9950],
    'Nehru Institute of Engineering, Coimbatore': [11.0320, 76.9720],
    'Rathinam Technical Campus, Coimbatore': [11.0450, 77.0050],
    'Tamilnadu College of Engineering, Coimbatore': [11.0180, 76.9620],
    'Nirmala College for Women, Coimbatore': [11.0220, 76.9580],
    'Avinashilingam University, Coimbatore': [11.0300, 76.9800],
    'Bharathiar University, Coimbatore': [11.1050, 76.9350],
    'Government Arts College, Coimbatore': [11.0170, 76.9650],
    'CMS College of Science and Commerce, Coimbatore': [11.0190, 76.9680],
    'Park College of Engineering, Coimbatore': [11.0210, 76.9590],
    'Sri Ramakrishna Engineering College, Coimbatore': [11.0280, 76.9920],
    'Bannari Amman Institute of Technology, Coimbatore': [11.1500, 77.3500],
    'PSG Institute of Management, Coimbatore': [11.0260, 76.9460],
    'Coimbatore Medical College, Coimbatore': [11.0050, 76.9650],
    'Tamil Nadu Agricultural University, Coimbatore': [11.0150, 76.9300]
  };

  const locations = [
    'Kuniyamuthur, Coimbatore', 'RS Puram, Coimbatore', 'Gandhipuram, Coimbatore', 
    'Saibaba Colony, Coimbatore', 'Peelamedu, Coimbatore', 'Singanallur, Coimbatore', 
    'Ganapathy, Coimbatore', 'Saravanampatti, Coimbatore',
    'PSG College of Technology, Coimbatore', 'Coimbatore Institute of Technology, Coimbatore',
    'Amrita Vishwa Vidyapeetham, Coimbatore', 'Karunya Institute of Technology, Coimbatore',
    'PSGR Krishnammal College for Women, Coimbatore', 'Hindusthan College of Engineering, Coimbatore',
    'SNS College of Technology, Coimbatore', 'Kumaraguru College of Technology, Coimbatore',
    'Sri Krishna College of Engineering, Coimbatore', 'Karpagam Academy of Higher Education, Coimbatore',
    'Dr NGP Institute of Technology, Coimbatore', 'KGiSL Institute of Technology, Coimbatore',
    'Nehru Institute of Engineering, Coimbatore', 'Rathinam Technical Campus, Coimbatore',
    'Tamilnadu College of Engineering, Coimbatore', 'Nirmala College for Women, Coimbatore',
    'Avinashilingam University, Coimbatore', 'Bharathiar University, Coimbatore',
    'Government Arts College, Coimbatore', 'CMS College of Science and Commerce, Coimbatore',
    'Park College of Engineering, Coimbatore', 'Sri Ramakrishna Engineering College, Coimbatore',
    'Bannari Amman Institute of Technology, Coimbatore', 'PSG Institute of Management, Coimbatore',
    'Coimbatore Medical College, Coimbatore', 'Tamil Nadu Agricultural University, Coimbatore'
  ];

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setCalculating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setStart(`Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
          setStartCoords([lat, lng]);
          setCalculating(false);
          alert(`Location found: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        },
        (error) => {
          setCalculating(false);
          console.error('Geolocation error:', error);
          if (error.code === 1) {
            alert('Location permission denied. Please enable location access in your browser settings.');
          } else if (error.code === 2) {
            alert('Location unavailable. Please check your device GPS settings.');
          } else if (error.code === 3) {
            alert('Location request timeout. Please try again.');
          } else {
            alert('Unable to get current location: ' + error.message);
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      alert('Geolocation is not supported by this browser');
    }
  };

  const handleStartChange = (e) => {
    const value = e.target.value;
    setStart(value);
    
    if (value.length > 0) {
      const filtered = locations.filter(loc => 
        loc.toLowerCase().includes(value.toLowerCase())
      );
      setStartSuggestions(filtered);
      setShowStartSuggestions(true);
    } else {
      setStartSuggestions([]);
      setShowStartSuggestions(false);
    }
  };

  const selectStartSuggestion = (location) => {
    setStart(location);
    setShowStartSuggestions(false);
    setStartCoords(locationCoords[location]);
  };

  const handleEndChange = (e) => {
    const value = e.target.value;
    setEnd(value);
    
    if (value.length > 0) {
      const filtered = locations.filter(loc => 
        loc.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (location) => {
    setEnd(location);
    setShowSuggestions(false);
  };

  const handleRouteFound = (routeData) => {
    setResult({
      distance: `${routeData.distance} km`,
      duration: `${routeData.time} mins`
    });
    setCalculating(false);
  };

  const calculateRoute = () => {
    if (!start || !end) {
      alert('Please enter both locations');
      return;
    }

    setCalculating(true);
    setResult(null);

    let startCoord;
    if (startCoords) {
      startCoord = startCoords;
    } else if (start.includes('(') && start.includes(',')) {
      const match = start.match(/\(([\d.]+),\s*([\d.]+)\)/);
      if (match) {
        startCoord = [parseFloat(match[1]), parseFloat(match[2])];
      }
    } else {
      startCoord = locationCoords[start] || [11.0168, 76.9558];
    }

    const endCoord = locationCoords[end] || [11.0168, 76.9674];

    setStartCoords(startCoord);
    setEndCoords(endCoord);
    setShowRoute(true);

    // Use OSRM API for accurate routing
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startCoord[1]},${startCoord[0]};${endCoord[1]},${endCoord[0]}?overview=false`;
    
    fetch(osrmUrl)
      .then(response => response.json())
      .then(data => {
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const distanceKm = (route.distance / 1000).toFixed(2);
          const timeMin = Math.round(route.duration / 60);
          
          setResult({
            distance: `${distanceKm} km`,
            duration: `${timeMin} mins`
          });
        } else {
          // Fallback calculation
          const R = 6371;
          const dLat = (endCoord[0] - startCoord[0]) * Math.PI / 180;
          const dLon = (endCoord[1] - startCoord[1]) * Math.PI / 180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(startCoord[0] * Math.PI / 180) * Math.cos(endCoord[0] * Math.PI / 180) *
                    Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const straightDist = R * c;
          const roadDist = (straightDist * 1.4).toFixed(2);
          const estTime = Math.ceil(straightDist * 1.4 * 2.5);

          setResult({
            distance: `${roadDist} km`,
            duration: `${estTime} mins`
          });
        }
        setCalculating(false);
      })
      .catch(error => {
        console.error('Routing error:', error);
        // Fallback calculation
        const R = 6371;
        const dLat = (endCoord[0] - startCoord[0]) * Math.PI / 180;
        const dLon = (endCoord[1] - startCoord[1]) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(startCoord[0] * Math.PI / 180) * Math.cos(endCoord[0] * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const straightDist = R * c;
        const roadDist = (straightDist * 1.4).toFixed(2);
        const estTime = Math.ceil(straightDist * 1.4 * 2.5);

        setResult({
          distance: `${roadDist} km`,
          duration: `${estTime} mins`
        });
        setCalculating(false);
      });
  };

  return (
    <div>
      <Navbar />
      <div className="container">
        <h1>🗺️ AI Route Optimization</h1>
        <div className="route-form">
          <div className="form-group" style={{ position: 'relative' }}>
            <label>Start Location</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input 
                  type="text" 
                  value={start} 
                  onChange={handleStartChange}
                  onFocus={() => start && setShowStartSuggestions(true)}
                  placeholder="Enter start address" 
                  style={{ width: '100%', padding: '12px', border: '2px solid #ddd', borderRadius: '8px', fontSize: '16px' }}
                />
                {showStartSuggestions && startSuggestions.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'white',
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    marginTop: '5px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}>
                    {startSuggestions.map((loc, index) => (
                      <div
                        key={index}
                        onClick={() => selectStartSuggestion(loc)}
                        style={{
                          padding: '12px',
                          cursor: 'pointer',
                          borderBottom: index < startSuggestions.length - 1 ? '1px solid #eee' : 'none'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#f0f0f0'}
                        onMouseLeave={(e) => e.target.style.background = 'white'}
                      >
                        📍 {loc}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={getCurrentLocation} className="btn-primary" style={{ width: 'auto', padding: '10px 20px' }}>
                📍 Current Location
              </button>
            </div>
          </div>
          <div className="form-group" style={{ position: 'relative' }}>
            <label>Delivery Location</label>
            <input 
              type="text" 
              value={end} 
              onChange={handleEndChange}
              onFocus={() => end && setShowSuggestions(true)}
              placeholder="Enter delivery address" 
              style={{ width: '100%', padding: '12px', border: '2px solid #ddd', borderRadius: '8px', fontSize: '16px' }}
            />
            {showSuggestions && suggestions.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'white',
                border: '2px solid #ddd',
                borderRadius: '8px',
                marginTop: '5px',
                maxHeight: '200px',
                overflowY: 'auto',
                zIndex: 1000,
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}>
                {suggestions.map((loc, index) => (
                  <div
                    key={index}
                    onClick={() => selectSuggestion(loc)}
                    style={{
                      padding: '12px',
                      cursor: 'pointer',
                      borderBottom: index < suggestions.length - 1 ? '1px solid #eee' : 'none'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#f0f0f0'}
                    onMouseLeave={(e) => e.target.style.background = 'white'}
                  >
                    📍 {loc}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={calculateRoute} className="btn-primary" disabled={calculating}>
            {calculating ? 'Calculating Route...' : 'Calculate Optimal Route'}
          </button>
          
          {result && (
            <div className="result-card" style={{ marginTop: '20px' }}>
              <h3>✅ Optimized Route Calculated</h3>
              <p><strong>Distance:</strong> {result.distance}</p>
              <p><strong>Estimated Time:</strong> {result.duration}</p>
              <p><strong>Algorithm:</strong> Dijkstra's Shortest Path (OpenStreetMap)</p>
            </div>
          )}
        </div>

        <div className="map-section" style={{ marginTop: '20px' }}>
          <h2>Route Map</h2>
          <MapContainer 
            center={startCoords || [11.0168, 76.9558]} 
            zoom={13} 
            style={{ height: '500px', width: '100%', borderRadius: '8px' }}
            key={`${startCoords}-${endCoords}`}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            {startCoords && (
              <Marker position={startCoords} icon={startIcon}>
                <Popup>Start: {start}</Popup>
              </Marker>
            )}
            {endCoords && (
              <Marker position={endCoords} icon={endIcon}>
                <Popup>End: {end}</Popup>
              </Marker>
            )}
            {showRoute && startCoords && endCoords && (
              <RoutingMachine start={startCoords} end={endCoords} onRouteFound={handleRouteFound} />
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}

export default RouteOptimization;
