const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';

const io = socketIo(server, {
  cors: {
    origin: allowedOrigin,
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const authRoutes = require('./routes/auth');
const classroomRoutes = require('./routes/classrooms');
const problemRoutes = require('./routes/problems');
const submissionRoutes = require('./routes/submissions');
const runRoutes = require('./routes/run');
const examRoutes = require('./routes/exams');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/classrooms', classroomRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/run', runRoutes);
app.use('/api/exams', examRoutes);

// Root + health check endpoints
app.get('/', (req, res) => {
  res.json({ name: 'Collaborative Learning API', status: 'ok' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'Backend is running!' });
});

// Socket.IO real-time events
const socketEvents = require('./services/socketEvents');
socketEvents(io);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Allowed frontend origin: ${allowedOrigin}`);
});
