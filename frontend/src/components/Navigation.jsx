import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';

const Navigation = ({ userProfile, onLogout }) => {
  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/">Secure Purchase Order System</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Home</Nav.Link>
            {userProfile?.role === 'purchaser' && (
              <Nav.Link as={Link} to="/create">Create Purchase Order</Nav.Link>
            )}
          </Nav>
          <Nav>
            <Navbar.Text className="me-3">
              Signed in as: <span className="text-white">{userProfile?.user?.username}</span> ({userProfile?.role})
            </Navbar.Text>
            <Button variant="outline-light" onClick={onLogout}>Logout</Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation;