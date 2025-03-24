import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Container, Row, Col, Card, Badge, Button, Modal, Alert, Spinner } from 'react-bootstrap';

const PurchaseOrderList = () => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    // Load user profile from localStorage
    try {
      const storedProfile = localStorage.getItem('userProfile');
      if (storedProfile) {
        setUserProfile(JSON.parse(storedProfile));
      }
    } catch (error) {
      console.error('Error parsing user profile:', error);
    }
  }, []);

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8000/api/purchase-orders/');
      setPurchaseOrders(response.data);
      setError('');
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      setError('Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  };

  const handleResetDatabase = async () => {
    try {
      setResetting(true);
      
      // First, delete all signatures
      await axios.post('http://localhost:8000/api/reset-database/', {
        confirm: true
      });
      
      setSuccess('Database successfully reset! All purchase orders have been deleted.');
      setPurchaseOrders([]);
      setShowResetModal(false);
    } catch (error) {
      console.error('Error resetting database:', error);
      setError(`Failed to reset database: ${error.response?.data?.error || error.message}`);
    } finally {
      setResetting(false);
      setShowResetModal(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge bg="warning">Pending</Badge>;
      case 'created':
        return <Badge bg="info">Created</Badge>;
      case 'approved':
        return <Badge bg="success">Approved</Badge>;
      case 'rejected':
        return <Badge bg="danger">Rejected</Badge>;
      case 'processed':
        return <Badge bg="secondary">Processed</Badge>;
      default:
        return <Badge bg="light">Unknown</Badge>;
    }
  };

  if (loading && !purchaseOrders.length) {
    return (
      <Container className="mt-4 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading purchase orders...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <h2>Purchase Orders</h2>
      
      {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
      {success && <Alert variant="success" className="mb-3">{success}</Alert>}
      
      <div className="mb-4 d-flex justify-content-between align-items-center">
        {userProfile?.role === 'purchaser' && (
          <Link to="/create">
            <Button variant="primary">Create New Purchase Order</Button>
          </Link>
        )}
        
        {userProfile?.role === 'supervisor' && (
          <Button 
            variant="danger" 
            onClick={() => setShowResetModal(true)}
            className="ms-auto"
          >
            Reset Database
          </Button>
        )}
      </div>
      
      {purchaseOrders.length === 0 ? (
        <p>No purchase orders found.</p>
      ) : (
        <Row>
          {purchaseOrders.map((order) => (
            <Col md={6} lg={4} key={order.id} className="mb-4">
              <Card>
                <Card.Body>
                  <Card.Title>PO-{order.order_number}</Card.Title>
                  <Card.Subtitle className="mb-2 text-muted">
                    {getStatusBadge(order.status)}
                  </Card.Subtitle>
                  <Card.Text>
                    <strong>Vendor:</strong> {order.vendor}<br />
                    <strong>Amount:</strong> ${order.amount}<br />
                    <strong>Created:</strong> {new Date(order.created_at).toLocaleDateString()}
                  </Card.Text>
                  <Link to={`/purchase-orders/${order.id}`}>
                    <Button variant="outline-primary">View Details</Button>
                  </Link>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
      
      {/* Reset Database Confirmation Modal */}
      <Modal show={showResetModal} onHide={() => setShowResetModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger">Reset Database</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p><strong>Warning:</strong> This will permanently delete ALL purchase orders and signatures from the database. This action cannot be undone.</p>
          <p>Are you sure you want to proceed?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowResetModal(false)} disabled={resetting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleResetDatabase} disabled={resetting}>
            {resetting ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                Resetting...
              </>
            ) : 'Reset Database'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default PurchaseOrderList;