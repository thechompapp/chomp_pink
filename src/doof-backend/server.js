import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import filtersRoutes from './routes/filters.js';
import adminRoutes from './routes/admin.js';
import listsRoutes from './routes/lists.js';
import trendingRoutes from './routes/trending.js';
import placesRoutes from './routes/places.js';
import submissionsRoutes from './routes/submissions.js';
import restaurantsRoutes from './routes/restaurants.js';
import dishesRoutes from './routes/dishes.js';
import searchRoutes from './routes/search.js';
import db from './db/index.js';

const app = express();

const corsOptions = {
    origin: 'http://localhost:5173',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/filters', filtersRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/lists', listsRoutes);
app.use('/api/trending', trendingRoutes);
app.use('/api/places', placesRoutes);
app.use('/api/submissions', submissionsRoutes);
app.use('/api/restaurants', restaurantsRoutes);
app.use('/api/dishes', dishesRoutes);
app.use('/api/search', searchRoutes);

app.set('db', db);

app.use((err, req, res, next) => {
    console.error('Global Error Handler:', err);
    const statusCode = err.status || 500;
    const message = process.env.NODE_ENV === 'development' ? (err.message || 'Internal Server Error') : 'Internal Server Error';
    res.status(statusCode).json({ error: message });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`ERROR: Port ${PORT} is already in use. Stop the other process or change the port.`);
    } else {
        console.error('Server startup error:', err);
    }
    process.exit(1);
});