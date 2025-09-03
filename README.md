# 🏠 Rental Home Management System

A comprehensive property rental management platform built with modern web technologies, designed to streamline the rental process for both property managers and tenants.

## 🚀 Tech Stack

### Frontend

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Redux Toolkit** - State management
- **Lucide React** - Icon library
- **Sonner** - Toast notifications

### Backend

- **Express.js** - Node.js web framework
- **TypeScript** - Type-safe development
- **Prisma ORM** - Database ORM
- **PostgreSQL** - Primary database
- **PostGIS** - Geospatial extension for location features

### Infrastructure

- **AWS Cognito** - Authentication & user management
- **AWS S3** - File storage for property images
- **Docker** - Containerization
- **Jenkins** - CI/CD pipeline

## 📋 Current Features

### 🔐 Authentication & Authorization

- ✅ AWS Cognito integration
- ✅ Role-based access control (Manager/Tenant)
- ✅ Secure login/logout functionality

### 🏢 For Property Managers

- ✅ **Property Management**

  - Create, edit, and delete properties
  - Upload multiple property images
  - Set pricing, deposits, and application fees
  - Manage property amenities and highlights
  - Geolocation-based property mapping

- ✅ **Application Management**

  - View and process rental applications
  - Approve/reject applications with reasons
  - Automated lease creation upon approval
  - Tenant background verification workflow

- ✅ **Lease Management**

  - View all active and expired leases
  - Monitor lease terms and rental amounts
  - Track payment status for each lease
  - Lease history and documentation

- ✅ **Termination Request Management**

  - Review tenant termination requests
  - Approve/reject requests with detailed responses
  - Automated lease status updates
  - Communication tracking with tenants

- ✅ **Dashboard & Analytics**
  - Property performance metrics
  - Application status tracking
  - Revenue and occupancy insights

### 🏠 For Tenants

- ✅ **Property Search & Discovery**

  - Advanced search with filters (price, location, amenities)
  - Interactive map view with geolocation
  - Property favorites and wishlist
  - Detailed property information and image galleries

- ✅ **Application Management**

  - Submit rental applications online
  - Track application status in real-time
  - Upload required documents
  - Receive automated notifications

- ✅ **Residence Management**

  - View current lease information
  - Access lease documents and agreements
  - Submit lease termination requests
  - Track termination request status

- ✅ **Payment Tracking**

  - View payment history and due dates
  - Monitor payment status
  - Download payment receipts

- ✅ **Communication**
  - Real-time notifications (SSE)
  - Message center for landlord communication
  - Request status updates

### 🔔 Notification System

- ✅ Real-time Server-Sent Events (SSE)
- ✅ Application status notifications
- ✅ Payment reminders
- ✅ Lease termination updates
- ✅ System announcements

### 🗺️ Location Features

- ✅ PostGIS integration for geospatial queries
- ✅ Interactive maps with property markers
- ✅ Location-based search and filtering
- ✅ Distance calculations and nearby amenities

## 🚧 Features in Development

### 📱 Enhanced Mobile Experience

- 🔄 **Mobile App** (React Native planned)
- 🔄 **Progressive Web App (PWA)** features
- 🔄 **Mobile-optimized UI/UX**

### 💰 Payment Integration

- 🔄 **Stripe Payment Gateway**
  - Online rent payments
  - Automated payment processing
  - Payment history and receipts
  - Late fee calculations

### 🔧 Maintenance & Support

- 🔄 **Maintenance Request System**
  - Tenant maintenance request submission
  - Manager request assignment and tracking
  - Service provider network integration
  - Request priority management

### 📊 Advanced Analytics

- 🔄 **Business Intelligence Dashboard**
  - Revenue analytics and forecasting
  - Occupancy rate tracking
  - Market analysis and pricing insights
  - Performance benchmarking

### 🤖 AI-Powered Features

- 🔄 **Smart Property Recommendations**
  - ML-based property matching
  - Personalized search results
  - Predictive pricing models

### 📋 Document Management

- 🔄 **Digital Document System**
  - Electronic lease signing
  - Document version control
  - Automated document generation
  - Secure document storage

### 🔍 Enhanced Search

- 🔄 **Advanced Search Features**
  - Elasticsearch integration
  - Semantic search capabilities
  - Search result ranking
  - Search analytics

### 🌐 Multi-Language Support

- 🔄 **Internationalization (i18n)**
  - Multiple language support
  - Regional currency formats
  - Localized content

## 🛠️ Setup & Installation

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+ with PostGIS extension
- AWS Account (for Cognito and S3)
- Docker (optional)

### Installation Steps

1. **Clone the repository**

   ```bash
   git clone https://github.com/XuanDongVo/Rental-Home.git
   cd Rental-Home
   ```

2. **Install dependencies**

   ```bash
   # Install server dependencies
   cd server
   npm install

   # Install client dependencies
   cd ../client
   npm install
   ```

3. **Database setup**

   ```bash
   cd server
   npx prisma migrate dev
   npx prisma db seed
   ```

4. **Start development servers**

   ```bash
   # Terminal 1: Start backend server
   cd server
   npm run dev

   # Terminal 2: Start frontend server
   cd client
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
