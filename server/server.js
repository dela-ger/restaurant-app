process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, p) => {
  console.error('❌ Unhandled Rejection at:', p, 'reason:', reason);
});

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/order');
const tableRoutes = require('./routes/table');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
// static folder for uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/media', require('./routes/media'));

// static folder for QR codes
app.use('/qrcodes', express.static(path.join(__dirname, 'qrcodes')));

// API routes

app.use('/api/menu', menuRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/table', tableRoutes);


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
})