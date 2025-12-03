# Multimodal Demo - Employee Data & Project Management

A full-stack demo application for managing employee multimedia data and project locations with interactive maps and geocoding capabilities.

## Features

- 📁 **Device File Upload** - Upload files directly from your device with automatic type detection
- 🗺️ **Interactive Map** - Leaflet-based map showing all project locations
- 🌍 **City-based Geocoding** - Enter city names to automatically fetch coordinates
- 👤 **Employee-Centric Workflow** - Link projects to employees and view all their data in one place
- 📍 **Project Location Management** - Add, view, and search project locations
- 🔍 **Consolidated Search** - Search by employee ID to see both multimedia and project data
- 📊 **Sorted Project Lists** - Projects automatically sorted by creation date

## Prerequisites

- PostgreSQL 15 (without PostGIS)
- Node.js (v14 or higher)
- npm

## Quick Start

### 1. Setup Database

```bash
# Start PostgreSQL (if not already running)
pg_ctl -D /opt/homebrew/var/postgresql@15 start

# Run the SQL script to create database, tables, and sample data
psql -U $(whoami) -d postgres -f multimodal_demo_simple.sql
```

**Note:** The script creates a database named `multimodal_demo` with sample data for employees EMP1001 and EMP1002.

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Configuration

The database connection is already configured in `index.js` to use Unix socket connection (no password needed on macOS):

```javascript
const pool = new Pool({
  user: process.env.USER,
  host: '/tmp',
  database: 'multimodal_demo',
  port: 5432
});
```

### 4. Start the Server

```bash
npm start
```

Server will run at `http://localhost:3000`

### 5. Open the Frontend

Open your browser and navigate to:
```
http://localhost:3000
```

You'll see an interactive dashboard with:
- 🗺️ **Interactive Leaflet map** - Click anywhere to set coordinates
- 📁 **Add multimedia** - Upload files from your device with drag & drop support
- � **View employee data** - Search by employee ID to see media and projects
- 📌 **Add project location** - Use city name for automatic geocoding
- 📊 **All project locations** - Sorted list with map view buttons

## Frontend Features

### Interactive Map
- Leaflet.js map with OpenStreetMap tiles
- Click anywhere on the map to auto-fill latitude/longitude in project form
- "View on Map" buttons to locate specific projects
- Dynamic marker updates

### File Upload
- Upload files directly from your device (no URL needed)
- Drag & drop support
- Automatic MIME type detection by browser
- Files stored in `/uploads` directory with unique filenames
- 50MB file size limit

### City-based Geocoding
- Enter a city name (e.g., "Bangalore" or "Berlin, Germany")
- System automatically fetches coordinates using Nominatim API
- Visual feedback showing found location
- Click on map to manually override coordinates if needed

### Employee Data Management
- Search by employee ID to see all associated data
- Consolidated view of both multimedia files and projects
- Each project shows: name, ID, employee, description, coordinates
- Quick access to view projects on map

### Project Management
- Add projects with employee ID linking
- Sorted by creation date (newest first)
- View all projects in a scrollable list
- One-click map navigation for each project

## API Endpoints

### 1. Upload Multimedia File

```bash
curl -X POST http://localhost:3000/media \
  -F "file=@/path/to/your/file.jpg" \
  -F "owner_type=employee" \
  -F "owner_id=EMP1001" \
  -F "tags=work,demo" \
  -F "description=Sample file" \
  -F "uploaded_by=admin"
```

### 2. Get Media by Owner

```bash
curl http://localhost:3000/media/employee/EMP1001
```

### 3. Get Projects by Employee

```bash
curl http://localhost:3000/projects/EMP1001
```

### 4. Get All Projects (Sorted)

```bash
curl http://localhost:3000/all-projects
```

### 5. Add Project Location (with City Geocoding)

```bash
curl -X POST http://localhost:3000/project-location \
  -H "Content-Type: application/json" \
  -d '{
    "proj_id":"PROJ104",
    "name":"Berlin Office Expansion",
    "description":"New office setup",
    "city":"Berlin, Germany",
    "employee_id":"EMP1001",
    "created_by":"admin"
  }'
```

### 6. Geocode City to Coordinates

```bash
curl http://localhost:3000/geocode/Bangalore
```

## Database Schema

### Tables

- **`multimedia`** - Stores multimedia metadata with local file storage
  - Columns: media_id, owner_type, owner_id, file_name, file_type, storage_type, file_url, file_size, uploaded_by, tags, description, uploaded_at
  
- **`project_location`** - Project locations with decimal coordinates and employee linking
  - Columns: location_id, proj_id, name, description, latitude, longitude, employee_id, created_by, created_at
  
- **`office_location`** - Office locations (for reference)
  - Columns: office_id, office_name, address, latitude, longitude

### Views

- **`multimedia_summary`** - Aggregated view of multimedia counts by owner

### Sample Data

- 2 offices: Hyderabad HQ, Pune Branch
- 3 project locations linked to employees (Hyderabad Data Center, Pune Tech Park, Chennai Innovation Lab)
- 2 multimedia entries (profile photo, project diagram)

## Technologies Used

- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL 15 (without PostGIS)
- **File Upload:** Multer (multipart/form-data handling)
- **Geocoding:** Nominatim API (OpenStreetMap)
- **HTTP Client:** node-fetch
- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **Mapping:** Leaflet.js with OpenStreetMap tiles

## Key Features Implemented

✅ Device file upload with drag & drop  
✅ Automatic file type detection  
✅ City-based geocoding (no manual lat/lon entry needed)  
✅ Employee-project linking  
✅ Consolidated employee data view (media + projects)  
✅ Sorted project listings by creation date  
✅ Interactive map with click-to-set coordinates  
✅ RESTful API with 7 endpoints  
✅ Local file storage in `/uploads` directory  
✅ Real-time map marker updates  

## Extending the Demo

### 1. Add Authentication

- Implement JWT-based authentication
- Add role-based access control (RBAC)
- Protect endpoints with middleware

### 2. Cloud Storage Integration

- Migrate from local storage to AWS S3 or Azure Blob
- Update `storage_type` to `cloud`
- Implement signed URLs for secure file access

### 3. Enhanced Search & Filtering

### 3. Enhanced Search & Filtering

- Full-text search across project descriptions
- Filter by date range, employee, or location
- Advanced geospatial queries (radius search)

### 4. Docker Support

Create a `docker-compose.yml` for one-command startup:
- PostgreSQL 15 container
- Node.js app container
- Volume mounting for persistent data

### 5. Data Export & Reporting

- Export project data to CSV/Excel
- Generate PDF reports with maps
- Analytics dashboard with charts

## Project Structure

```
DBSA/
├── multimodal_demo_simple.sql  # Database schema (PostgreSQL 15, no PostGIS)
├── package.json                 # Node.js dependencies
├── index.js                     # Express API server with 7 endpoints
├── public/
│   └── index.html               # Interactive frontend with Leaflet.js
├── uploads/                     # Local file storage directory
├── README.md                    # This file
└── .gitignore                   # Git ignore patterns
```

## Dependencies

```json
{
  "express": "^4.18.2",
  "pg": "^8.11.0",
  "body-parser": "^1.20.2",
  "multer": "^1.4.5-lts.1",
  "node-fetch": "^2.7.0"
}
```

## Troubleshooting

### PostgreSQL Connection Issues
- Ensure PostgreSQL is running: `pg_ctl -D /opt/homebrew/var/postgresql@15 status`
- Check socket connection: `/tmp/.s.PGSQL.5432`
- Verify database exists: `psql -l`

### File Upload Issues
- Check `/uploads` directory exists and has write permissions
- Verify 50MB file size limit in `index.js` multer configuration
- Ensure `multipart/form-data` encoding in requests

### Geocoding Issues
- Nominatim API requires city names (e.g., "Bangalore" or "Berlin, Germany")
- Rate limit: Max 1 request per second
- Fallback: Use map click to set coordinates manually

## License

MIT License - Feel free to use this demo for learning and development purposes.

## Contact

For questions or improvements, please open an issue or submit a pull request.

---

**Last Updated:** December 3, 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
- Click-to-select coordinates

### Forms
- Add multimedia metadata
- Add project locations with geographic coordinates
- Search and filter media by owner
- Real-time distance calculations

## Technologies Used

- **PostgreSQL** - Relational database
- **PostGIS** - Spatial database extension
- **Node.js** - Runtime environment
- **Express** - Web framework
- **pg** - PostgreSQL client for Node.js

## License

MIT
