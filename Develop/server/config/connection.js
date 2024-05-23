const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/googlebooks';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  tls: true, // Force TLS
  tlsAllowInvalidHostnames: true, // Allow invalid hostnames (e.g., localhost)
});

module.exports = mongoose.connection;
