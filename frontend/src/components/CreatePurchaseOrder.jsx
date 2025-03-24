import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Form, Button, Alert, Spinner, Card, Modal } from 'react-bootstrap';
import { symmetricEncrypt, generateSymmetricKey, hashData, signData } from '../utils/cryptoFunctions';
import { getPrivateKey } from '../utils/keyStorage';

// Add axios interceptor to include authorization token in all requests
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Token ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

const CreatePurchaseOrder = () => {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    vendor: '',
    details: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [showSignModal, setShowSignModal] = useState(false);
  const [signingLoading, setSigningLoading] = useState(false);
  const [signSuccess, setSignSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Load user profile on component mount
    const storedProfile = localStorage.getItem('userProfile');
    if (storedProfile) {
      try {
        setUserProfile(JSON.parse(storedProfile));
      } catch (e) {
        console.error('Error parsing user profile:', e);
        // Invalid profile, redirect to login
        navigate('/login');
      }
    } else {
      // No profile, redirect to login
      navigate('/login');
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate form data
      if (!formData.vendor || !formData.description || !formData.amount || !formData.details) {
        throw new Error('All fields are required');
      }

      // Parse amount as a float and validate
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Amount must be a positive number');
      }

      console.log("Creating purchase order with details:", {
        vendor: formData.vendor,
        description: formData.description,
        amount
      });

      // Generate a symmetric key for encrypting the details
      const symmetricKey = await generateSymmetricKey();
      if (!symmetricKey) {
        throw new Error('Failed to generate encryption key');
      }
      
      console.log("Generated symmetric key successfully");
      
      try {
        // Encrypt the details
        const encryptedDetails = await symmetricEncrypt(
          { 
            details: formData.details,
            createdBy: userProfile?.user?.username || 'unknown',
            timestamp: new Date().toISOString()
          }, 
          symmetricKey
        );
        
        // Validate encrypted data
        if (!encryptedDetails || !encryptedDetails.iv || !encryptedDetails.encryptedData) {
          throw new Error('Failed to encrypt purchase order details');
        }
        
        console.log("Encrypted purchase order details successfully");
        
        // Combine the encrypted details and key into a single object
        const encryptedData = {
          data: encryptedDetails,
          key: symmetricKey
        };
        
        // Create the purchase order
        console.log("Sending purchase order to server...");
        const response = await axios.post('http://localhost:8000/api/purchase-orders/', {
          description: formData.description,
          amount: amount,
          vendor: formData.vendor,
          encrypted_details: JSON.stringify(encryptedData)
        });
        
        console.log("Purchase order created successfully:", response.data);
        
        // Get the created purchase order
        const purchaseOrder = response.data;
        setCreatedOrder(purchaseOrder);
        
        // Show the signing modal
        setShowSignModal(true);
        setLoading(false);
        
      } catch (encryptError) {
        console.error("Error in encryption process:", encryptError);
        throw new Error(`Encryption error: ${encryptError.message}`);
      }
    } catch (error) {
      console.error('Error creating purchase order:', error);
      let errorMessage = 'Failed to create purchase order: ';
      
      if (error.response?.data?.detail) {
        errorMessage += error.response.data.detail;
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Unknown error occurred';
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleSignOrder = async () => {
    setSigningLoading(true);
    setError('');
    try {
      // Check if we have a private key
      const privateKey = getPrivateKey();
      if (!privateKey) {
        throw new Error('Private key not found. Please log in again.');
      }
      
      console.log("Private key retrieved, length:", privateKey.length);
      console.log("Key starts with:", privateKey.substring(0, 27) + "...");

      // Calculate hash of the purchase order
      const orderData = {
        id: createdOrder.id,
        order_number: createdOrder.order_number,
        description: createdOrder.description,
        amount: createdOrder.amount,
        vendor: createdOrder.vendor,
        timestamp: new Date().toISOString()
      };
      
      console.log("Order data prepared:", JSON.stringify(orderData));
      
      // Step 1: Hash the data - let's do this carefully with error handling
      console.log("Calculating hash for purchase order...");
      let hash;
      try {
        hash = await hashData(orderData);
        console.log("Hash created successfully:", hash?.substring(0, 20) + "...");
      } catch (hashError) {
        console.error("Error in hash creation:", hashError);
        throw new Error(`Failed to create hash: ${hashError.message}`);
      }
      
      if (!hash) {
        throw new Error('Hash function returned empty result');
      }
      
      // Step 2: Sign the hash - with careful error tracking
      console.log("Signing purchase order hash...");
      let signature;
      try {
        signature = await signData(hash, privateKey);
        console.log("Signature created successfully, length:", signature?.length);
        console.log("Signature sample:", signature?.substring(0, 20) + "...");
      } catch (signError) {
        console.error("Error in signature creation:", signError);
        throw new Error(`Failed to sign data: ${signError.message}`);
      }
      
      if (!signature) {
        throw new Error('Signature function returned empty result');
      }
      
      // Step 3: Send the signature to the server
      console.log("Sending signature to server...");
      try {
        const response = await axios.post(`http://localhost:8000/api/purchase-orders/${createdOrder.id}/sign/`, {
          signature,
          hash
        });
        console.log("Server response:", response.data);
      } catch (postError) {
        console.error("Server error:", postError.response?.data || postError.message);
        throw new Error(`Server rejected signature: ${postError.response?.data?.detail || postError.message}`);
      }
      
      console.log("Purchase order signed successfully");
      setSignSuccess(true);
      
      // Navigate to the purchase order detail page after a brief delay
      setTimeout(() => {
        navigate(`/purchase-orders/${createdOrder.id}`);
      }, 1500);
    } catch (error) {
      console.error("Error signing order:", error);
      setError(`Failed to sign order: ${error.message}`);
      setSigningLoading(false);
    }
  };

  const handleSkipSigning = () => {
    setShowSignModal(false);
    
    // Navigate to the home page (or order detail page)
    if (createdOrder) {
      navigate(`/purchase-orders/${createdOrder.id}`);
    } else {
      navigate('/');
    }
  };

  if (!userProfile) {
    return (
      <Container className="mt-4 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <h2>Create Purchase Order</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Vendor</Form.Label>
          <Form.Control
            type="text"
            name="vendor"
            value={formData.vendor}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </Form.Group>
        
        <Form.Group className="mb-3">
          <Form.Label>Description</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </Form.Group>
        
        <Form.Group className="mb-3">
          <Form.Label>Amount ($)</Form.Label>
          <Form.Control
            type="number"
            step="0.01"
            min="0.01"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </Form.Group>
        
        <Form.Group className="mb-3">
          <Form.Label>Additional Details (will be encrypted)</Form.Label>
          <Form.Control
            as="textarea"
            rows={5}
            name="details"
            value={formData.details}
            onChange={handleChange}
            required
            disabled={loading}
          />
          <Form.Text className="text-muted">
            This information will be encrypted and only visible to authorized personnel.
          </Form.Text>
        </Form.Group>
        
        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? (
            <>
              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
              Creating...
            </>
          ) : 'Create Purchase Order'}
        </Button>
        <Button 
          variant="secondary" 
          className="ms-2" 
          onClick={() => navigate('/')}
          disabled={loading}
        >
          Cancel
        </Button>
      </Form>

      {/* Sign Modal */}
      <Modal show={showSignModal} onHide={() => setShowSignModal(false)} backdrop="static" keyboard={false}>
        <Modal.Header>
          <Modal.Title>Sign Purchase Order</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {signSuccess ? (
            <Alert variant="success">Purchase order signed successfully! Redirecting...</Alert>
          ) : (
            <>
              <p>Purchase order <strong>PO-{createdOrder?.order_number}</strong> has been created successfully.</p>
              <p>Would you like to sign this purchase order now? Signing confirms that you are the creator and authorizes the purchase.</p>
              <Alert variant="info">
                Your digital signature will be cryptographically linked to this document and cannot be repudiated.
              </Alert>
              {error && <Alert variant="danger">{error}</Alert>}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleSkipSigning} disabled={signingLoading || signSuccess}>
            Skip Signing
          </Button>
          <Button variant="primary" onClick={handleSignOrder} disabled={signingLoading || signSuccess}>
            {signingLoading ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                Signing...
              </>
            ) : 'Sign Purchase Order'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default CreatePurchaseOrder;