const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const fileUpload = require('express-fileupload');
const app = express();
const server = http.createServer(app);


dotenv.config();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());
app.options('*', cors());
app.use(cors());

app.get('/', (req, res) => {
    console.log("Hello World!");
    res.send('Hello World!');
})

app.use('/scan', require('./routes/scan_routes'));


// app error handler
app.use((err, req, res, next) => {
    console.log(err);
    res.status(500).send('Something broke!');
});


module.exports = { app, server };

const port = process.env.PORT || 3000;

server.listen(port, () => {
    console.log(`Server running on port ${port}`);
})