import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Card, Button, Alert, Spinner } from 'react-bootstrap';
import { hashData, signData } from '../utils/cryptoFunctions';
import { getPrivateKey } from '../utils/keyStorage';

const SignPurchaseOrder = () => {
  const { id } = useParams();
  const [purchaseOrder, setPurchaseOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPurchaseOrder = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/api/purchase-orders/${id}/`);
        setPurchaseOrder(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching purchase order:', error);
        setError('Failed to load purchase order');
        setLoading(false);
      }
    };

    fetchPurchaseOrder();
  }, [id]);

  const handleSign = async (action) => {
    setSigning(true);
    setError('');
    setSuccess(false);

    try {
      // Get the private key from local storage
      const privateKey = getPrivateKey();
      if (!privateKey) {
        setError('Private key not found. Please log in again.');
        setSigning(false);
        return;
      }

      console.log(`Starting ${action} process for purchase order ${id}`);

      // Create a hash of the purchase order data
      const orderData = {
        id: purchaseOrder.id,
        order_number: purchaseOrder.order_number,
        description: purchaseOrder.description,
        amount: purchaseOrder.amount,
        vendor: purchaseOrder.vendor,
        timestamp: new Date().toISOString()
      };
      
      console.log("Order data prepared for signing:", orderData);
      
      // Hash the data
      console.log("Hashing order data...");
      let hash;
      try {
        hash = await hashData(orderData);
        console.log("Hash created successfully:", hash);
      } catch (hashError) {
        console.error("Error creating hash:", hashError);
        throw new Error(`Failed to create hash: ${hashError.message}`);
      }
      
      // Sign the hash
      console.log("Signing hash...");
      let signature;
      try {
        signature = await signData(hash, privateKey);
        console.log("Signature created:", signature?.substring(0, 50) + "...");
      } catch (signError) {
        console.error("Error creating signature:", signError);
        throw new Error(`Failed to sign data: ${signError.message}`);
      }
      
      // Send the signature to the server
      console.log("Sending signature to server...");
      try {
        const response = await axios.post(`http://localhost:8000/api/purchase-orders/${id}/sign/`, {
          signature,
          hash
        });
        console.log("Server response:", response.data);
      } catch (serverError) {
        console.error("Server error:", serverError.response?.data || serverError.message);
        throw new Error(`Server rejected signature: ${serverError.response?.data?.detail || serverError.message}`);
      }
      
      setSuccess(true);
      setTimeout(() => {
        navigate(`/purchase-orders/${id}`);
      }, 1500);
    } catch (error) {
      console.error("Error signing order:", error);
      setError(`Failed to sign purchase order: ${error.message}`);
    } finally {
      setSigning(false);
    }
  };

  const canSign = purchaseOrder && purchaseOrder.status === 'pending';

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <Spinner animation="border" />
          <p>Loading purchase order...</p>
        </div>
      </Container>
    );
  }

  if (!purchaseOrder) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          Purchase order not found or failed to load.
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <h1>Sign Purchase Order</h1>
      
      {error && (
        <Alert variant="danger">
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert variant="success">
          Purchase order signed successfully! Redirecting...
        </Alert>
      )}
      
      <Card className="mb-4">
        <Card.Header>
          <h2>Purchase Order: {purchaseOrder.order_number}</h2>
        </Card.Header>
        <Card.Body>
          <p><strong>Vendor:</strong> {purchaseOrder.vendor}</p>
          <p><strong>Amount:</strong> ${typeof purchaseOrder.amount === 'number' ? purchaseOrder.amount.toFixed(2) : purchaseOrder.amount}</p>
          <p><strong>Description:</strong> {purchaseOrder.description}</p>
          <p><strong>Status:</strong> {purchaseOrder.status}</p>
          <p><strong>Created At:</strong> {new Date(purchaseOrder.created_at).toLocaleString()}</p>
        </Card.Body>
      </Card>
      
      <Alert variant="info">
        By signing this purchase order, you confirm that the information provided is accurate and you authorize this purchase. Your digital signature will be permanently attached to this document and cannot be repudiated.
      </Alert>
      
      <div className="d-flex gap-2">
        {canSign && (
          <Button 
            variant="primary" 
            onClick={() => handleSign('sign')} 
            disabled={signing || success}
          >
            {signing ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                Signing...
              </>
            ) : 'Sign Purchase Order'}
          </Button>
        )}
          
        <Button 
          variant="secondary" 
          onClick={() => navigate(`/purchase-orders/${id}`)}
          disabled={signing}
        >
          Back
        </Button>
      </div>
    </Container>
  );
};

export default SignPurchaseOrder;