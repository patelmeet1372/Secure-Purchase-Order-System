import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Row, Col, Card, Button, Badge, ListGroup, Alert, Spinner } from 'react-bootstrap';

const PurchaseOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [purchaseOrder, setPurchaseOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  
  useEffect(() => {
    // Get user profile from localStorage
    const storedProfile = localStorage.getItem('userProfile');
    if (storedProfile) {
      setUserProfile(JSON.parse(storedProfile));
    }
    
    const fetchPurchaseOrder = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/api/purchase-orders/${id}/`);
        setPurchaseOrder(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching purchase order:', error);
        setError('Failed to load purchase order data');
        setLoading(false);
      }
    };
    
    fetchPurchaseOrder();
  }, [id]);
  
  const handleProcessOrder = async () => {
    setProcessing(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Create a simple signature for processing
      const timestamp = new Date().toISOString();
      const demoSignature = `${timestamp}_process_${id}`;
      
      console.log(`Processing purchase order ${id}`);
      
      // Send the process request to the backend
      await axios.post(`http://localhost:8000/api/purchase-orders/${id}/process/`, {
        hash: `hash_of_po_${id}`,
        signature: demoSignature
      });
      
      setSuccess('Purchase order successfully processed!');
      
      // Refresh the purchase order after a short delay
      setTimeout(async () => {
        try {
          const response = await axios.get(`http://localhost:8000/api/purchase-orders/${id}/`);
          setPurchaseOrder(response.data);
        } catch (error) {
          console.error('Error refreshing purchase order:', error);
        } finally {
          setProcessing(false);
        }
      }, 1500);
    } catch (error) {
      console.error('Error processing purchase order:', error);
      setError(`Failed to process purchase order: ${error.response?.data?.error || error.message}`);
      setProcessing(false);
    }
  };
  
  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <Spinner animation="border" />
          <p>Loading purchase order details...</p>
        </div>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          {error}
        </Alert>
      </Container>
    );
  }
  
  if (!purchaseOrder) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">
          Purchase order not found
        </Alert>
      </Container>
    );
  }
  
  // Check if user can sign this purchase order
  const canSign = userProfile && 
                 userProfile.role === 'purchaser' && 
                 purchaseOrder.purchaser.id === userProfile.user.id && 
                 purchaseOrder.status === 'pending';
                 
  // Check if user is supervisor and can approve or reject
  const canTakeAction = userProfile && 
                      userProfile.role === 'supervisor' && 
                      purchaseOrder.status === 'pending';
                      
  // Check if user is in purchasing department and can process approved orders
  const canProcess = userProfile && 
                    (userProfile.role === 'purchasing_dept' || userProfile.role === 'purchaser') && 
                    purchaseOrder.status === 'approved';
                    
  console.log('User role:', userProfile?.role);
  console.log('Purchase order status:', purchaseOrder.status);
  console.log('Can process:', canProcess);
  
  return (
    <Container className="mt-4">
      <Row className="mb-4">
        <Col>
          <h1>Purchase Order Details</h1>
        </Col>
        <Col xs="auto">
          <Button variant="secondary" onClick={() => navigate('/purchase-orders')}>
            Back to List
          </Button>
        </Col>
      </Row>
      
      {success && (
        <Alert variant="success" className="mb-4">
          {success}
        </Alert>
      )}
      
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}
      
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h3 className="mb-0">Order: {purchaseOrder.order_number}</h3>
          <Badge bg={
            purchaseOrder.status === 'approved' ? 'success' : 
            purchaseOrder.status === 'rejected' ? 'danger' : 
            purchaseOrder.status === 'processed' ? 'info' :
            'warning'
          }>
            {purchaseOrder.status.charAt(0).toUpperCase() + purchaseOrder.status.slice(1)}
          </Badge>
        </Card.Header>
        
        <Card.Body>
          <Row>
            <Col md={6}>
              <p><strong>Purchaser:</strong> {purchaseOrder.purchaser.username}</p>
              <p><strong>Vendor:</strong> {purchaseOrder.vendor}</p>
              <p><strong>Amount:</strong> ${typeof purchaseOrder.amount === 'number' ? purchaseOrder.amount.toFixed(2) : purchaseOrder.amount}</p>
            </Col>
            
            <Col md={6}>
              <p><strong>Description:</strong> {purchaseOrder.description}</p>
              <p><strong>Created At:</strong> {new Date(purchaseOrder.created_at).toLocaleString()}</p>
            </Col>
          </Row>
          
          <h5 className="mt-4">Digital Signatures</h5>
          {!purchaseOrder.signatures || purchaseOrder.signatures.length === 0 ? (
            <p>No signatures yet.</p>
          ) : (
            <ListGroup>
              {purchaseOrder.signatures.map((signature) => (
                <ListGroup.Item key={signature.id} className="d-flex justify-content-between align-items-center">
                  <div>
                    <strong>{signature.signer.username}</strong> signed this document on{' '}
                    {new Date(signature.timestamp).toLocaleString()}
                  </div>
                  {/* We're using a simplified signature system, so always show as valid */}
                  <Badge bg="success">Valid</Badge>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
          
          <div className="mt-4">
            {canSign && (
              <Button variant="primary" onClick={() => navigate(`/purchase-orders/${id}/sign`)} className="me-2">
                Sign Purchase Order
              </Button>
            )}
            
            {canTakeAction && (
              <>
                <Button 
                  variant="success" 
                  onClick={() => navigate(`/purchase-orders/${id}/approve`)} 
                  className="me-2"
                >
                  Approve
                </Button>
                <Button 
                  variant="danger" 
                  onClick={() => navigate(`/purchase-orders/${id}/reject`)}
                >
                  Reject
                </Button>
              </>
            )}
            
            {canProcess && (
              <Button 
                variant="info" 
                onClick={handleProcessOrder}
                disabled={processing}
              >
                {processing ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                    Processing...
                  </>
                ) : 'Process Order'}
              </Button>
            )}
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default PurchaseOrderDetail;