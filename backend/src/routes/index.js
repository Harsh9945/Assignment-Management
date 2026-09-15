const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const groupRoutes = require('./groupRoutes');
const assignmentRoutes = require('./assignmentRoutes');
const studentRoutes = require('./studentRoutes');
const adminRoutes = require('./adminRoutes');

router.use('/auth', authRoutes);
router.use('/groups', groupRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/students', studentRoutes);
router.use('/admin', adminRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
