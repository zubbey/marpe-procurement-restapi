require('dotenv').config({path: '.env'});
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const app = express();
const PORT = process.env.PORT || 5000;
const routes = require('./routes/router');
const DIR = './uploads';
// Middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({
    credentials: true,
    origin: [
        'http://procurement.marpe.online',
	'https://procurement.marpe.online'
    ]
}));
app.use('/api', routes);
app.use('./uploads', express.static('uploads'));

// DB Connection
// marpe4pass

app.get('/', (req, res) => {
    res.send('<h1> Welcome to Marpe Online Procument Backend.</h1>')
});
app.get('/uploads/:filename', async (req, res) => {
    let image = await path.join(__dirname, `/uploads/${req.params.filename}`);
    res.sendFile(image);
});
// for products images
app.get('/uploads/products/:filename', async (req, res) => {
    let image = await path.join(__dirname, `/uploads/products/${req.params.filename}`);
    res.sendFile(image);
});

// for products Thumbnails
app.get('/uploads/products/thumbnails/:filename', async (req, res) => {
    let image = await path.join(__dirname, `/uploads/products/thumbnails/${req.params.filename}`);
    res.sendFile(image);
});
app.delete('/uploads/:filename', (req, res) => {
    message : "Error! in image upload.";
    if (!req.params.filename) {
        message = "Error! in image delete.";
        return res.status(500).json('error in delete');
    
      } else {
        try {
            fs.unlinkSync(DIR+'/'+req.params.filename);
            return res.status(200).send('Successfully! Image has been Deleted');
        } catch (err) {
        // handle the error
        return res.status(400).send(err);
        }
        
      }
});
mongoose.connect(process.env.PRODUCTION_DB, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true  }, ()=> {
    console.log('Database connected successfully!')
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// server port connection
app.listen(PORT, ()=> console.log(`Listen to Port: ${PORT}`));
