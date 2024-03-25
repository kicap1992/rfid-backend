const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const fileUpload = require('express-fileupload');
const socket = require('./socket');
const app = express();
const server = http.createServer(app);
const io = socket.init(server);

dotenv.config();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());
app.options('*', cors());
app.use(cors());

app.get('/', (req, res) => {
    console.log("Hello World!");
    res.send('Hello World!');
});

app.use('/scan', require('./routes/scan_routes'));
app.use('/login', require('./routes/login_routes'));
app.use('/user', require('./routes/user_routes'));

// app error handler
app.use((err, req, res, next) => {
    console.log(err);
    res.status(500).send('Something broke!');
});

io.on('connection', (socket) => {
    let userID = socket.id;
    console.log('A user connected: ' + userID);

    socket.on('scan_dia', (data) => {
        console.log('Received scan_dia event: ' + data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected: ' + userID);
    });
});

module.exports = {
    app,
    server,
    io
};
const port = process.env.PORT || 3000;

server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
