import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Container, Card, Button, Alert, Spinner } from 'react-bootstrap';

const ApproveRejectPurchaseOrder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isApprove = location.pathname.includes('/approve');
  const action = isApprove ? 'approve' : 'reject';
  
  const [purchaseOrder, setPurchaseOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  useEffect(() => {
    const fetchPurchaseOrder = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/api/purchase-orders/${id}/`);
        setPurchaseOrder(response.data);
      } catch (error) {
        console.error('Error fetching purchase order:', error);
        setError('Failed to load purchase order details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPurchaseOrder();
  }, [id]);
  
  const handleAction = async () => {
    setProcessing(true);
    setError('');
    setSuccess('');
    
    try {
      // Create a simpler signature for demo purposes
      const timestamp = new Date().toISOString();
      const demoSignature = `${timestamp}_${action}_${id}`;
      
      console.log(`Performing ${action} action on purchase order ${id}`);
      
      // Send the action request to the backend
      await axios.post(`http://localhost:8000/api/purchase-orders/${id}/${action}/`, {
        hash: `hash_of_po_${id}`, 
        signature: demoSignature
      });
      
      setSuccess(`Purchase order successfully ${isApprove ? 'approved' : 'rejected'}!`);
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate(`/purchase-orders/${id}`);
      }, 2000);
    } catch (error) {
      console.error(`Error ${action}ing purchase order:`, error);
      setError(`Failed to ${action} purchase order: ${error.response?.data?.error || error.message}`);
    } finally {
      setProcessing(false);
    }
  };
  
  if (loading) {
    return (
      <Container className="mt-4 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading purchase order...</span>
        </Spinner>
      </Container>
    );
  }
  
  if (!purchaseOrder) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">Purchase order not found</Alert>
        <Button variant="secondary" onClick={() => navigate('/purchase-orders')}>
          Back to List
        </Button>
      </Container>
    );
  }
  
  return (
    <Container className="mt-4">
      <h1>{isApprove ? 'Approve' : 'Reject'} Purchase Order</h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      
      <Card className="mb-4">
        <Card.Header>
          <h2>Purchase Order: {purchaseOrder.order_number}</h2>
        </Card.Header>
        <Card.Body>
          <p><strong>Purchaser:</strong> {purchaseOrder.purchaser.username}</p>
          <p><strong>Vendor:</strong> {purchaseOrder.vendor}</p>
          <p><strong>Amount:</strong> ${typeof purchaseOrder.amount === 'number' ? purchaseOrder.amount.toFixed(2) : purchaseOrder.amount}</p>
          <p><strong>Description:</strong> {purchaseOrder.description}</p>
          <p><strong>Created At:</strong> {new Date(purchaseOrder.created_at).toLocaleString()}</p>
        </Card.Body>
      </Card>
      
      <Alert variant={isApprove ? 'info' : 'warning'}>
        {isApprove ? 
          'By approving this purchase order, you confirm that you have reviewed the details and authorize this transaction. Your digital signature will be permanently attached to this document.' :
          'By rejecting this purchase order, you indicate that this purchase should not proceed. Your digital signature will be permanently attached to this document.'}
      </Alert>
      
      <div className="d-flex gap-2">
        <Button 
          variant={isApprove ? 'success' : 'danger'} 
          onClick={handleAction} 
          disabled={processing}
        >
          {processing ? (
            <>
              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
              Processing...
            </>
          ) : (isApprove ? 'Approve Purchase Order' : 'Reject Purchase Order')}
        </Button>
        
        <Button 
          variant="secondary" 
          onClick={() => navigate(`/purchase-orders/${id}`)}
          disabled={processing}
        >
          Cancel
        </Button>
      </div>
    </Container>
  );
};

export default ApproveRejectPurchaseOrder; 