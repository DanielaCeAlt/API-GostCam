# 🏭 GostCAM - Equipment Management System

> **Advanced Equipment Management System** built with Next.js 15, TypeScript, and MySQL for comprehensive inventory tracking, maintenance scheduling, and operational reporting.

![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![MySQL](https://img.shields.io/badge/MySQL-8.0-orange?style=for-the-badge&logo=mysql)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-06B6D4?style=for-the-badge&logo=tailwindcss)

## ✨ Features

### 🔍 **Advanced Equipment Search**
- Multi-criteria filtering (type, status, location, dates)
- Intelligent pagination with navigation
- Real-time search results
- Export capabilities

### 🔄 **Transfer Management**
- Equipment transfers between locations
- Validation and approval workflows
- Transfer history tracking
- Bulk transfer operations

### 🔧 **Maintenance Scheduling**
- Preventive, corrective, and urgent maintenance
- Priority-based scheduling
- Technician assignment
- Maintenance history and analytics

### 📊 **Comprehensive Reporting**
- 8 different report types
- CSV export functionality
- Real-time statistics
- Custom date range filtering

### 💻 **Modern Interface**
- Responsive React components
- Dashboard with multiple views
- Interactive data visualization
- Intuitive navigation system

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MySQL 8.0+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/DanielaCeAlt/gostcam-equipment-management.git
cd gostcam-equipment-management

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your database credentials

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🏗️ Architecture

### **Frontend**
- **Next.js 15** with Turbopack for fast development
- **TypeScript** for type safety
- **Tailwind CSS** for modern styling
- **Chart.js** for data visualization
- **React Hooks** for state management

### **Backend APIs**
- **RESTful APIs** with Next.js API routes
- **MySQL** database with optimized queries
- **Stored procedures** for complex operations
- **Authentication** and authorization system

### **Database Schema**
- Equipment inventory tracking
- User management and roles
- Movement and transfer logs
- Maintenance scheduling
- Comprehensive audit trails

## 📁 Project Structure

```
src/
├── app/
│   ├── api/                 # API routes
│   │   ├── auth/           # Authentication
│   │   ├── equipos/        # Equipment management
│   │   │   ├── search/     # Advanced search
│   │   │   ├── transfer/   # Transfer operations
│   │   │   ├── maintenance/ # Maintenance scheduling
│   │   │   └── reports/    # Reporting system
│   │   └── dashboard/      # Dashboard data
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx           # Home page
├── components/
│   ├── Dashboard.tsx       # Main dashboard
│   ├── EquiposAvanzados.tsx # Equipment management
│   ├── LoginScreen.tsx     # Authentication
│   └── Navigation.tsx      # App navigation
├── contexts/
│   └── AppContext.tsx      # Global state management
├── lib/
│   ├── apiService.ts       # API client
│   ├── database.ts         # Database utilities
│   └── mockData.ts         # Development data
└── types/
    └── database.ts         # TypeScript definitions
```

## 🔧 API Endpoints

### Equipment Management
- `GET /api/equipos` - List all equipment
- `POST /api/equipos/search` - Advanced search with filters
- `GET /api/equipos/[no_serie]` - Equipment details
- `POST /api/equipos/transfer` - Create transfers
- `POST /api/equipos/maintenance` - Schedule maintenance
- `POST /api/equipos/reports` - Generate reports

### System Management
- `POST /api/auth/login` - User authentication
- `GET /api/dashboard` - Dashboard statistics
- `GET /api/catalogos` - System catalogs

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript validation
```

### Environment Variables

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=gostcam

# App Configuration
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=http://localhost:3000
```

## 📊 Database Setup

The application requires a MySQL database with the following main tables:
- `equipo` - Equipment inventory
- `movimientoinventario` - Movement tracking
- `usuarios` - User management
- `sucursales` - Branch locations
- `tipoequipo` - Equipment types

Refer to the database migration scripts in `/database` folder.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Daniela Ce Alt**
- GitHub: [@DanielaCeAlt](https://github.com/DanielaCeAlt)
- Email: msc_iceja2024@accitesz.com

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Tailwind CSS for the utility-first CSS framework
- Chart.js for beautiful data visualizations
- MySQL team for the robust database system

---

<p align="center">Made with ❤️ for efficient equipment management</p>
