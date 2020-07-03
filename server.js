require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const app = express();
const PORT = process.env.PORT || 5000;
const routes = require('./routes/router');

// Middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use('/api', routes);

// DB Connection
// marpe4pass

app.get('/', (req, res) => {
    res.send('<h1> Welcome to Marpe Online Procument Backend.</h1>')
});

mongoose.connect(process.env.PRODUCTION_DB, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true  }, ()=> {
    console.log('Database connected successfully!')
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// server port connection
app.listen(PORT, ()=> console.log(`Listen to Port: ${PORT}`));
