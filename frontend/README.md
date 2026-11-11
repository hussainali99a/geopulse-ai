# GeoPulse AI dashboard

The React/Vite dashboard polls the existing FastAPI tracking endpoint every two
seconds:

`http://127.0.0.1:8000/api/v1/tracking/vehicles`

Run the frontend with `npm run dev`. Vehicle activity and fleet analytics are
derived from the API's latest location for each vehicle. A vehicle is marked
inactive when its last GPS timestamp is older than five minutes.

Set `VITE_VEHICLE_INACTIVITY_MINUTES` in the frontend environment to configure
that threshold. It must be a positive number; otherwise the dashboard uses the
five-minute default.
