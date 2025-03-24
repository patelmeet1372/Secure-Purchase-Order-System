import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { storePrivateKey, getDemoPrivateKey, clearPrivateKey, testDemoKeys, isValidPemKey } from '../utils/keyStorage';
import { Container, Form, Button, Alert, Spinner } from 'react-bootstrap';

const Login = ({ setToken }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Check if user is already logged in on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setToken(token);
      navigate('/');
    } else {
      // If not logged in, clear any stale data
      clearPrivateKey();
      localStorage.removeItem('userProfile');
    }
  }, [navigate, setToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Validate input
      if (!username.trim() || !password.trim()) {
        throw new Error('Username and password are required');
      }
      
      // Attempt login
      const response = await axios.post('http://localhost:8000/api/token/', {
        username: username.trim(),
        password: password.trim()
      });
      
      if (!response.data || !response.data.token) {
        throw new Error('Invalid response from server');
      }
      
      const { token } = response.data;
      localStorage.setItem('token', token);
      setToken(token);
      
      // Set authorization header for future requests
      axios.defaults.headers.common['Authorization'] = `Token ${token}`;
      
      // Get user profile
      const profileResponse = await axios.get('http://localhost:8000/api/profiles/me/');
      
      if (!profileResponse.data) {
        throw new Error('Failed to retrieve user profile');
      }
      
      localStorage.setItem('userProfile', JSON.stringify(profileResponse.data));
      
      // Clear any existing private key before storing a new one
      clearPrivateKey();
      
      // For demo purposes, store the demo private key
      const privateKey = getDemoPrivateKey(username);
      if (privateKey) {
        console.log(`Got demo private key for ${username}, storing in localStorage...`);
        
        // Test keys to debug any format issues
        testDemoKeys();
        console.log(`Key for ${username} is valid PEM format:`, isValidPemKey(privateKey));
        
        const storeResult = storePrivateKey(privateKey);
        if (!storeResult) {
          console.warn("Failed to store private key in localStorage");
          setError("Warning: Failed to store private key. Signing features may not work properly.");
        } else {
          console.log("Private key stored successfully");
        }
      } else {
        console.warn("No demo private key found for this user. Some features may not work correctly.");
        setError("Warning: No demo key found for this user. Signing features may not work properly.");
      }
      
      setLoading(false);
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'Login failed: ';
      if (error.response) {
        // Server responded with an error status code
        if (error.response.data?.non_field_errors) {
          errorMessage += error.response.data.non_field_errors.join(', ');
        } else if (error.response.data?.detail) {
          errorMessage += error.response.data.detail;
        } else {
          errorMessage += `Server error (${error.response.status})`;
        }
      } else if (error.request) {
        // Request was made but no response received
        errorMessage += 'No response from server. Please check your connection.';
      } else {
        // Something else caused the error
        errorMessage += error.message || 'Unknown error occurred';
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: "100vh" }}>
      <div className="w-100" style={{ maxWidth: "400px" }}>
        <h2 className="text-center mb-4">Secure Purchase Order System</h2>
        {error && <Alert variant="danger">{error}</Alert>}
        
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Username</Form.Label>
            <Form.Control
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </Form.Group>
          
          <Button variant="primary" type="submit" className="w-100" disabled={loading}>
            {loading ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                Logging in...
              </>
            ) : 'Login'}
          </Button>
        </Form>
      </div>
    </Container>
  );
};

export default Login;