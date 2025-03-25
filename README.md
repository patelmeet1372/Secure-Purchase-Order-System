# Secure Purchase Order System

A secure purchase order system with digital signatures and role-based workflow.

## Prerequisites

- Python 3.8 or higher
- Node.js 14 or higher
- Git

## Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/patelmeet1372/Secure-Purchase-Order-System.git
cd Secure-Purchase-Order-System
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv

# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 3. Frontend Setup
In a new terminal window:
```bash
cd frontend
npm install
npm start
```

## Accessing the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

## Test Credentials

- Purchaser: 
  - Username: `purchaser1`
  - Password: `test123`

- Supervisor:
  - Username: `supervisor1`
  - Password: `test123`

- Purchasing Department:
  - Username: `purchasing1`
  - Password: `test123`

## Features

- Role-based access control
- Digital signatures for purchase orders
- Multi-step approval workflow
- Audit logging
- Secure authentication

## Troubleshooting

If you encounter any issues:

1. Make sure all prerequisites are installed
2. Check if the virtual environment is activated
3. Verify that all dependencies are installed correctly
4. Ensure both backend and frontend servers are running
5. Check the console for any error messages

## Security Note

This is a demo application. For production use:
- Change all default passwords
- Use proper secret keys
- Enable HTTPS
- Implement proper key management
- Use production-grade database 