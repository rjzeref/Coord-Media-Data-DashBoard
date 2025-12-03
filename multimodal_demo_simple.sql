-- multimodal_demo_simple.sql (without PostGIS - simpler demo)
-- Run: psql -U $(whoami) -d postgres -f multimodal_demo_simple.sql

-- 1) Create DB
DROP DATABASE IF EXISTS multimodal_demo;
CREATE DATABASE multimodal_demo;
\c multimodal_demo

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
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  employee_id VARCHAR(64),  -- Link project to employee
  created_on TIMESTAMP DEFAULT now(),
  created_by VARCHAR(64)
);

CREATE TABLE office_location (
  office_id SERIAL PRIMARY KEY,
  office_name VARCHAR(200),
  address TEXT,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  created_on TIMESTAMP DEFAULT now()
);

-- 3) Indexes
CREATE INDEX idx_multimedia_owner ON multimedia(owner_type, owner_id);
CREATE INDEX idx_projloc_coords ON project_location(latitude, longitude);
CREATE INDEX idx_officeloc_coords ON office_location(latitude, longitude);

-- 4) Sample data
INSERT INTO office_location (office_name, address, latitude, longitude)
VALUES
('Hyderabad Office','88 MG Road, Hyderabad', 17.3850, 78.4867),
('Pune Office','50 MG Road, Pune', 18.5204, 73.8567);

INSERT INTO project_location (proj_id, name, description, latitude, longitude, employee_id, created_by)
VALUES
(1,'Attendance Tracker Office','Hyderabad team site', 17.3855, 78.4860, 'EMP1001', 'pm_user'),
(2,'Budget Analysis Zone','Pune site area', 18.5150, 73.8500, 'EMP1002', 'pm_user'),
(3,'Recruitment Portal Office','Chennai site', 13.0827, 80.2707, 'EMP1001', 'pm_user');

INSERT INTO multimedia (owner_type, owner_id, file_name, file_type, storage_type, file_url, file_size, uploaded_by, tags, description)
VALUES
('employee','EMP1001','ravi_profile.jpg','image/jpeg','url','https://example.com/ravi_profile.jpg',120000,'hr_user',ARRAY['profile'],'Profile photo for Ravi'),
('project','1','attendance_design.png','image/png','url','https://example.com/attendance_design.png',540000,'pm_user',ARRAY['design','diagram'],'Design diagram for Attendance Tracker');

-- 5) Simple view (media by owner)
CREATE VIEW vw_media_by_owner AS
SELECT owner_type, owner_id, media_id, file_name, file_type, file_url, uploaded_on FROM multimedia;

-- Done
