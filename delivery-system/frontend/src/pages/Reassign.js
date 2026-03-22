import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';
import axios from 'axios';
import Navbar from '../components/Navbar';

const API_URL = 'http://localhost:5002/api';

function DeliveryRoutingMachine({ start, end }) {
  const map = useMap();
  const routingControlRef = useRef(null);

  useEffect(() => {
    if (!map || !start || !end) return;

    if (routingControlRef.current) {
      try {
        map.removeControl(routingControlRef.current);
        routingControlRef.current = null;
      } catch (e) {
        // Ignore cleanup errors
      }
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
      } catch (e) {
        console.log('Routing error:', e);
      }
    }, 100);

    return () => {
      if (routingControlRef.current) {
        try {
          map.removeControl(routingControlRef.current);
          routingControlRef.current = null;
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, [map, start, end]);

  return null;
}

function Reassign() {
  const [worker, setWorker] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showMap, setShowMap] = useState(false);
  const [reassignData, setReassignData] = useState(null);
  const [showReasonDialog, setShowReasonDialog] = useState(false);
  const [reason, setReason] = useState('');
  const [requestSent, setRequestSent] = useState(false);
  const [showDeliveryMap, setShowDeliveryMap] = useState(false);
  const [deliveryLocation] = useState({ lat: 11.0300, lng: 76.9800, address: 'RS Puram, Coimbatore' });
  const [currentLocation, setCurrentLocation] = useState(null);
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    if (userId) {
      loadWorkerData();
      loadNotifications();
      const interval = setInterval(() => {
        loadWorkerData();
        loadNotifications();
      }, 5000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadWorkerData = async () => {
    try {
      const response = await axios.get(`${API_URL}/workers/${userId}`);
      setWorker(response.data);
    } catch (error) {
      console.error('Error loading worker data:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      const response = await axios.get(`${API_URL}/notifications/${userId}`);
      setNotifications(response.data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const requestReassignment = async () => {
    if (!worker) return;
    
    if (!reason.trim()) {
      alert('Please enter a reason for reassignment');
      return;
    }
    
    const currentDateTime = new Date().toLocaleString();
    
    try {
      const response = await axios.post(`${API_URL}/reassignment/request`, {
        userId: userId,
        userName: worker.name,
        email: worker.email,
        bikeNumber: worker.bikeNumber,
        heartRate: worker.heartRate,
        temperature: worker.temperature,
        workTime: worker.workTime,
        reason: reason,
        requestDateTime: currentDateTime
      });
      console.log('Response:', response.data);
      alert(`Order reassignment request sent at ${currentDateTime}!`);
      setShowReasonDialog(false);
      setReason('');
      setRequestSent(true);
    } catch (error) {
      console.error('Full error:', error);
      console.error('Error response:', error.response);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to send reassignment request';
      alert('Error: ' + errorMsg);
    }
  };

  const acceptReassignment = async (notificationId, requesterId) => {
    try {
      const response = await axios.post(`${API_URL}/reassignment/accept`, {
        notificationId,
        accepterId: userId,
        requesterId
      });
      
      setReassignData(response.data);
      setShowMap(true);
      loadNotifications();
      alert('Order accepted! Check the map for route details.');
    } catch (error) {
      console.error('Error accepting reassignment:', error);
      const errorMsg = error.response?.data?.error || 'Failed to accept reassignment';
      alert(errorMsg);
      loadNotifications();
    }
  };

  const rejectReassignment = async (notificationId) => {
    try {
      await axios.post(`${API_URL}/reassignment/reject`, {
        notificationId
      });
      loadNotifications();
    } catch (error) {
      console.error('Error rejecting reassignment:', error);
    }
  };

  const handleOrderTaken = () => {
    setShowMap(false);
    setShowDeliveryMap(true);
    if (reassignData) {
      setCurrentLocation({ lat: reassignData.accepterLat, lng: reassignData.accepterLng });
    }
  };

  const userIcon = L.divIcon({
    html: '<div style="font-size: 30px; color: #0066FF;">👤</div>',
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });

  const requesterIcon = L.divIcon({
    html: '<div style="font-size: 30px; color: #FF0000;">📦</div>',
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });

  const deliveryIcon = L.divIcon({
    html: '<div style="font-size: 35px;">📦</div>',
    className: '',
    iconSize: [35, 35],
    iconAnchor: [17, 17]
  });

  return (
    <div>
      <Navbar />
      <div className="container">
        <h1>📦 Order Reassignment</h1>

        {worker && (
          <div className="worker-profile">
            <div className="profile-header">
              <h2>Your Health Status</h2>
            </div>
            <div className="profile-grid">
              <div className="profile-item"><strong>Name:</strong> {worker.name}</div>
              <div className="profile-item"><strong>Email:</strong> {worker.email}</div>
              <div className="profile-item"><strong>Bike Number:</strong> {worker.bikeNumber}</div>
              <div className="profile-item"><strong>❤️ Heart Rate:</strong> {worker.heartRate} BPM</div>
              <div className="profile-item"><strong>🌡️ Temperature:</strong> {worker.temperature.toFixed(1)} °C</div>
              <div className="profile-item"><strong>⏰ Work Time:</strong> {worker.workTime} hours</div>
            </div>
            <button 
              onClick={() => setShowReasonDialog(true)} 
              className="btn-danger" 
              style={{ marginTop: '20px', width: '100%' }}
              disabled={requestSent}
            >
              {requestSent ? '✅ Request Already Sent' : '🚨 Request Order Reassignment'}
            </button>
          </div>
        )}

        {showReasonDialog && (
          <div className="modal-overlay" onClick={() => setShowReasonDialog(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Reason for Reassignment</h2>
              <textarea 
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for order reassignment (e.g., feeling unwell, high workload, emergency)"
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '12px',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '16px',
                  marginTop: '15px',
                  resize: 'vertical'
                }}
              />
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button onClick={requestReassignment} className="btn-primary" style={{ flex: 1 }}>
                  Send Request
                </button>
                <button onClick={() => { setShowReasonDialog(false); setReason(''); }} className="btn-danger" style={{ flex: 1 }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {notifications.length > 0 && (
          <div className="notifications-section" style={{ marginTop: '30px' }}>
            <h2>📬 Reassignment Requests</h2>
            {notifications.filter((notif, index, self) => 
              index === self.findIndex((n) => n._id === notif._id)
            ).map((notif) => (
              <div key={notif._id} className="notification-card">
                <h3>🚨 Order Reassignment Request</h3>
                <div style={{ marginBottom: '15px' }}>
                  <p><strong>From:</strong> {notif.requesterName}</p>
                  <p><strong>Bike Number:</strong> {notif.bikeNumber}</p>
                  <p><strong>Reason:</strong> {notif.reason}</p>
                  {notif.requestDateTime && (
                    <p><strong>Request Time:</strong> {notif.requestDateTime}</p>
                  )}
                  {notif.createdAt && (
                    <p><strong>Request Date:</strong> {new Date(notif.createdAt).toLocaleString()}</p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                  <button 
                    onClick={() => acceptReassignment(notif._id, notif.requesterId)} 
                    className="btn-primary"
                    style={{ flex: 1 }}
                  >
                    ✅ Accept Order
                  </button>
                  <button 
                    onClick={() => rejectReassignment(notif._id)} 
                    className="btn-danger"
                    style={{ flex: 1 }}
                  >
                    ❌ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showMap && reassignData && (
          <div className="map-section" style={{ marginTop: '30px' }}>
            <h2>📍 Route to Requester</h2>
            <div className="result-card">
              <p><strong>Distance:</strong> {reassignData.distance} km</p>
              <p><strong>Estimated Time:</strong> {reassignData.time} mins</p>
              <p><strong>From:</strong> Your Location</p>
              <p><strong>To:</strong> {reassignData.requesterName}</p>
            </div>
            <MapContainer 
              center={[reassignData.accepterLat, reassignData.accepterLng]} 
              zoom={13} 
              style={{ height: '400px', width: '100%', borderRadius: '8px', marginTop: '20px' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap'
              />
              <Marker position={[reassignData.accepterLat, reassignData.accepterLng]} icon={userIcon}>
                <Popup>Your Location</Popup>
              </Marker>
              <Marker position={[reassignData.requesterLat, reassignData.requesterLng]} icon={requesterIcon}>
                <Popup>{reassignData.requesterName} (Requester)</Popup>
              </Marker>
              <DeliveryRoutingMachine 
                start={[reassignData.accepterLat, reassignData.accepterLng]} 
                end={[reassignData.requesterLat, reassignData.requesterLng]} 
              />
            </MapContainer>
            <button 
              className="btn-primary"
              style={{ marginTop: '20px', width: '100%', padding: '15px', fontSize: '18px' }}
              onClick={handleOrderTaken}
            >
              📦 Order Taken - View Delivery Location
            </button>
          </div>
        )}

        {showDeliveryMap && (
          <div className="map-section" style={{ marginTop: '30px' }}>
            <h2>📍 Original Order Delivery Location</h2>
            <div className="result-card">
              <p><strong>Delivery Address:</strong> {deliveryLocation.address}</p>
              <p><strong>Coordinates:</strong> {deliveryLocation.lat}, {deliveryLocation.lng}</p>
              {currentLocation && (
                <p><strong>Your Location:</strong> {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}</p>
              )}
            </div>
            <MapContainer 
              center={[deliveryLocation.lat, deliveryLocation.lng]} 
              zoom={13} 
              style={{ height: '400px', width: '100%', borderRadius: '8px', marginTop: '20px' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap'
              />
              {currentLocation && (
                <>
                  <Marker position={[currentLocation.lat, currentLocation.lng]} icon={userIcon}>
                    <Popup>Your Current Location</Popup>
                  </Marker>
                  <DeliveryRoutingMachine 
                    start={[currentLocation.lat, currentLocation.lng]} 
                    end={[deliveryLocation.lat, deliveryLocation.lng]} 
                  />
                </>
              )}
              <Marker position={[deliveryLocation.lat, deliveryLocation.lng]} icon={deliveryIcon}>
                <Popup>Delivery Location: {deliveryLocation.address}</Popup>
              </Marker>
            </MapContainer>
            <button 
              className="btn-primary"
              style={{ marginTop: '20px', width: '100%', padding: '15px', fontSize: '18px', background: '#28a745' }}
              onClick={() => {
                alert('Order delivered successfully!');
                setShowDeliveryMap(false);
                setReassignData(null);
                setCurrentLocation(null);
              }}
            >
              ✅ Mark as Delivered
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Reassign;
