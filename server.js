require('dotenv').config();

const connectDB = require('./src/config/db');
const app = require('./src/app');

const PORT = process.env.PORT || 5000;

/**
 * Starts the HTTP server after a successful database connection.
 *
 * @returns {Promise<void>}
 */
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    const host = 'localhost';
    const base = `http://${host}:${PORT}`;
    console.log(`Server listening on port ${PORT}`);
    console.log('');
    console.log(`App (open in browser): ${base}/`);
   
  });
};

startServer();
