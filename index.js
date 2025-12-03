// index.js - minimal API for multimodal_demo
const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const fetch = require('node-fetch');

const app = express();
app.use(bodyParser.json());

// Serve static files from public and uploads directories
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Configure DB connection (change user/password/host as needed)
const pool = new Pool({
  user: process.env.USER || 'postgres',
  host: 'localhost',
  database: 'multimodal_demo',
  password: '',  // No password for local macOS Postgres
  port: 5432
});

// Enable CORS for frontend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});

// 1) Add multimedia with file upload
app.post('/media', upload.single('file'), async (req, res) => {
  try {
    let file_url, file_name, file_type, file_size, storage_type;
    
    if (req.file) {
      // File uploaded from device
      file_name = req.file.originalname;
      file_type = req.file.mimetype;
      file_size = req.file.size;
      file_url = `/uploads/${req.file.filename}`;
      storage_type = 'local';
    } else {
      // URL provided (fallback to old behavior)
      file_name = req.body.file_name;
      file_type = req.body.file_type;
      file_size = parseInt(req.body.file_size) || 0;
      file_url = req.body.file_url;
      storage_type = 'url';
    }
    
    const { owner_type, owner_id, uploaded_by, tags, description } = req.body;
    
    // Parse tags if it's a string
    const tagsArray = typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(t => t) : tags;
    
    const q = `INSERT INTO multimedia (owner_type, owner_id, file_name, file_type, storage_type, file_url, file_size, uploaded_by, tags, description)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING media_id`;
    const vals = [owner_type, owner_id, file_name, file_type, storage_type, file_url, file_size, uploaded_by, tagsArray, description];
    const r = await pool.query(q, vals);
    
    res.json({ 
      success: true, 
      media_id: r.rows[0].media_id,
      file_url: file_url,
      file_type: file_type
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success:false, error: err.message });
  }
});

// 2) List media by owner
app.get('/media/:owner_type/:owner_id', async (req, res) => {
  const { owner_type, owner_id } = req.params;
  try {
    const q = `SELECT media_id, file_name, file_type, file_url, uploaded_on, tags FROM multimedia WHERE owner_type=$1 AND owner_id=$2 ORDER BY uploaded_on DESC`;
    const r = await pool.query(q, [owner_type, owner_id]);
    res.json(r.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get projects by employee ID
app.get('/projects/:employee_id', async (req, res) => {
  const { employee_id } = req.params;
  try {
    const q = `SELECT location_id, proj_id, name, description, latitude, longitude, created_on FROM project_location WHERE employee_id=$1 ORDER BY created_on DESC`;
    const r = await pool.query(q, [employee_id]);
    res.json(r.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get all project locations (sorted by creation date)
app.get('/all-projects', async (req, res) => {
  try {
    const q = `SELECT location_id, proj_id, name, description, latitude, longitude, employee_id, created_on FROM project_location ORDER BY created_on DESC`;
    const r = await pool.query(q);
    res.json(r.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Geocoding endpoint - convert city name to coordinates
app.get('/geocode/:city', async (req, res) => {
  const city = req.params.city;
  try {
    // Using Nominatim (OpenStreetMap) geocoding API - free and no API key required
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MultimodalDemoApp/1.0'
      }
    });
    const data = await response.json();
    
    if (data && data.length > 0) {
      res.json({
        success: true,
        city: data[0].display_name,
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon)
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'City not found. Please try a different name or be more specific.'
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3) Insert a project location (POINT) -- expects lon, lat OR city
// 3) Insert a project location (POINT) -- expects lon, lat OR city
app.post('/project-location', async (req, res) => {
  let { proj_id, name, description, lon, lat, city, employee_id, created_by } = req.body;
  
  try {
    // If city is provided instead of coordinates, geocode it
    if (city && (!lat || !lon)) {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'MultimodalDemoApp/1.0'
        }
      });
      const data = await response.json();
      
      if (data && data.length > 0) {
        lat = parseFloat(data[0].lat);
        lon = parseFloat(data[0].lon);
      } else {
        return res.status(400).json({ 
          success: false, 
          error: 'Could not find coordinates for the specified city. Please try a different name.' 
        });
      }
    }
    
    const q = `INSERT INTO project_location (proj_id, name, description, latitude, longitude, employee_id, created_by)
               VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING location_id`;
    const r = await pool.query(q, [proj_id, name, description, lat, lon, employee_id, created_by]);
    res.json({ success:true, location_id: r.rows[0].location_id, latitude: lat, longitude: lon });
  } catch(err){
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 4) Remove nearest projects endpoint (no longer needed)

// Root - serve the frontend
app.get('/', (req,res)=> res.sendFile(path.join(__dirname, 'public', 'index.html')));

// Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log(`Server listening on ${PORT}`));
