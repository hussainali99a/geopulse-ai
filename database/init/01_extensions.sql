
-- Enable geospatial capabilities
CREATE EXTENSION IF NOT EXISTS postgis;

-- Verify the extension
SELECT PostGIS_Full_Version();
