# Secure Purchase Order System - Frontend

This is the frontend application for the Secure Purchase Order System. It provides a user interface for creating, approving, and processing purchase orders with cryptographic security features.

## Features

- Secure authentication
- Public-key cryptography for signatures
- Role-based access control
- Purchase order creation and approval workflow
- Digital signatures for non-repudiation

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository
2. Navigate to the frontend directory
3. Install dependencies:


The application will be available at http://localhost:3000.

## Security Features

- RSA-2048 for digital signatures
- AES-256-GCM for symmetric encryption
- SHA-256 for hashing
- Secure key storage in browser

## Project Structure

- `src/components/` - React components
- `src/utils/` - Utility functions including cryptographic operations
- `src/App.js` - Main application component