import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Container, Spinner, Alert } from 'react-bootstrap';

// Components
import Login from './components/Login';
import Navigation from './components/Navigation';
import PurchaseOrderList from './components/PurchaseOrderList';
import CreatePurchaseOrder from './components/CreatePurchaseOrder';
import PurchaseOrderDetail from './components/PurchaseOrderDetail';
import SignPurchaseOrder from './components/SignPurchaseOrder';
import ApproveRejectPurchaseOrder from './components/ApproveRejectPurchaseOrder';

// Utils
import { clearPrivateKey } from './utils/keyStorage';

// Add axios interceptors for better error handling
axios.interceptors.response.use(
  response => response,
  error => {
    console.error('Axios error:', error);
    // Handle 401 Unauthorized errors globally
    if (error.response && error.response.status === 401) {
      // Clear auth data and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('userProfile');
      clearPrivateKey();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Create a fetchUserProfile function using useCallback to prevent infinite loops
  const fetchUserProfile = useCallback(async (authToken) => {
    try {
      if (!authToken) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      
      // Set up axios headers for this request
      const response = await axios.get('http://localhost:8000/api/profiles/me/', {
        headers: { Authorization: `Token ${authToken}` }
      });
      
      if (response.data) {
        localStorage.setItem('userProfile', JSON.stringify(response.data));
        setUserProfile(response.data);
      } else {
        throw new Error('No valid profile data returned from server');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Failed to load user profile. Please try logging in again.');
      handleLogout();
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogout = useCallback(() => {
    // Clean up all authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('userProfile');
    clearPrivateKey(); // Clear the private key on logout
    
    // Reset state
    setToken(null);
    setUserProfile(null);
    setError('');
    
    // Clear authorization header
    delete axios.defaults.headers.common['Authorization'];
    
    // Navigate to login
    navigate('/login', { replace: true });
  }, [navigate]);

  // Update axios defaults when token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Token ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Load user profile when token is set or location changes
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    
    if (storedToken) {
      try {
        // Try to get profile from localStorage first
        const storedProfile = localStorage.getItem('userProfile');
        if (storedProfile) {
          setUserProfile(JSON.parse(storedProfile));
          setLoading(false);
        } else {
          // Fetch profile if not in localStorage
          fetchUserProfile(storedToken);
        }
      } catch (e) {
        console.error('Error parsing user profile:', e);
        setError('Error loading profile data. Please log in again.');
        handleLogout();
      }
    } else {
      setLoading(false);
    }
  }, [token, fetchUserProfile, handleLogout, location]);

  // Force refresh the user profile on specific routes to ensure latest data
  useEffect(() => {
    // When returning to home after various operations, refresh the profile
    if (location.pathname === '/' && token) {
      fetchUserProfile(token);
    }
  }, [location.pathname, token, fetchUserProfile]);

  // Helper function to update token and trigger profile load
  const handleSetToken = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    // Explicitly fetch profile when setting a new token
    fetchUserProfile(newToken);
  };

  if (loading) {
    return (
      <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: "100vh" }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <div className="App">
      {token && <Navigation userProfile={userProfile} onLogout={handleLogout} />}
      {error && <Alert variant="danger" className="m-3">{error}</Alert>}
      
      <Routes>
        <Route 
          path="/login" 
          element={token ? <Navigate to="/" /> : <Login setToken={handleSetToken} />} 
        />
        
        <Route 
          path="/" 
          element={token ? <PurchaseOrderList key={location.key} /> : <Navigate to="/login" />} 
        />
        
        <Route 
          path="/create" 
          element={
            token && userProfile?.role === 'purchaser' 
              ? <CreatePurchaseOrder /> 
              : token ? <Navigate to="/" /> : <Navigate to="/login" />
          } 
        />
        
        <Route 
          path="/purchase-orders/:id" 
          element={token ? <PurchaseOrderDetail /> : <Navigate to="/login" />} 
        />
        
        <Route 
          path="/purchase-orders/:id/sign" 
          element={token ? <SignPurchaseOrder /> : <Navigate to="/login" />} 
        />
        
        <Route 
          path="/purchase-orders/:id/approve" 
          element={
            token && userProfile?.role === 'supervisor' 
              ? <ApproveRejectPurchaseOrder /> 
              : token ? <Navigate to="/" /> : <Navigate to="/login" />
          } 
        />
        
        <Route 
          path="/purchase-orders/:id/reject" 
          element={
            token && userProfile?.role === 'supervisor' 
              ? <ApproveRejectPurchaseOrder /> 
              : token ? <Navigate to="/" /> : <Navigate to="/login" />
          } 
        />
        
        <Route path="*" element={<Navigate to={token ? "/" : "/login"} />} />
      </Routes>
    </div>
  );
}

export default App;