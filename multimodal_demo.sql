-- multimodal_demo.sql
-- Run: psql -U <your_pg_user> -f multimodal_demo.sql
-- or run statements one-by-one in psql

-- 1) Create DB and enable extensions (run as a superuser)
DROP DATABASE IF EXISTS multimodal_demo;
CREATE DATABASE multimodal_demo;
\c multimodal_demo
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_raster;

-- 2) Tables for the demo
CREATE TABLE multimedia (
  media_id SERIAL PRIMARY KEY,
  owner_type VARCHAR(20) NOT NULL,        -- 'employee' | 'project' | 'other'
  owner_id VARCHAR(64) NOT NULL,          -- flexible id (e.g., EMP1001)
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50),
  storage_type VARCHAR(10) DEFAULT 'url',
  file_url TEXT,
  file_size INT,
  uploaded_by VARCHAR(64),
  uploaded_on TIMESTAMP DEFAULT now(),
  tags TEXT[],
  description TEXT
);

CREATE TABLE project_location (
  location_id SERIAL PRIMARY KEY,
  proj_id INT NOT NULL,
  name VARCHAR(200),
  description TEXT,
  geom GEOMETRY(Geometry, 4326) NOT NULL, -- supports POINT/POLYGON/LINESTRING
  created_on TIMESTAMP DEFAULT now(),
  created_by VARCHAR(64)
);

CREATE TABLE office_location (
  office_id SERIAL PRIMARY KEY,
  office_name VARCHAR(200),
  address TEXT,
  geom GEOMETRY(POINT, 4326),
  created_on TIMESTAMP DEFAULT now()
);

-- 3) Indexes
CREATE INDEX idx_multimedia_owner ON multimedia(owner_type, owner_id);
CREATE INDEX idx_projloc_geom ON project_location USING GIST (geom);
CREATE INDEX idx_officeloc_geom ON office_location USING GIST (geom);

-- 4) Sample data
INSERT INTO office_location (office_name, address, geom)
VALUES
('Hyderabad Office','88 MG Road, Hyderabad', ST_SetSRID(ST_MakePoint(78.4867,17.3850),4326)),
('Pune Office','50 MG Road, Pune', ST_SetSRID(ST_MakePoint(73.8567,18.5204),4326));

INSERT INTO project_location (proj_id, name, description, geom, created_by)
VALUES
(1,'Attendance Tracker Office','Hyderabad team site', ST_SetSRID(ST_MakePoint(78.4860,17.3855),4326), 'pm_user'),
(2,'Budget Analysis Zone','Pune site area', ST_SetSRID(ST_GeomFromText('POLYGON((73.84 18.50,73.86 18.50,73.86 18.53,73.84 18.53,73.84 18.50))'),4326), 'pm_user'),
(3,'Recruitment Portal Office','Chennai site', ST_SetSRID(ST_MakePoint(80.2707,13.0827),4326),'pm_user');

INSERT INTO multimedia (owner_type, owner_id, file_name, file_type, storage_type, file_url, file_size, uploaded_by, tags, description)
VALUES
('employee','EMP1001','ravi_profile.jpg','image/jpeg','url','https://example.com/ravi_profile.jpg',120000,'hr_user',ARRAY['profile'],'Profile photo for Ravi'),
('project','1','attendance_design.png','image/png','url','https://example.com/attendance_design.png',540000,'pm_user',ARRAY['design','diagram'],'Design diagram for Attendance Tracker');

-- 5) Simple view (media by owner)
CREATE VIEW vw_media_by_owner AS
SELECT owner_type, owner_id, media_id, file_name, file_type, file_url, uploaded_on FROM multimedia;

-- Done
