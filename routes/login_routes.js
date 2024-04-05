const express = require('express');
const router = express.Router();
const dotenv = require('dotenv');
const mysql = require('mysql');
const md5 = require('md5');

dotenv.config();


// Connect to the MySQL database
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});


router.get('/', async (req, res) => {
    console.log("Get test");
    res.send('Login get test');
})

router.post('/', async (req, res) => {
    const { username, password } = req.body
    // change password to string
    // password = password.toString();
    try {
        const query = 'SELECT * FROM tb_login_penyewa WHERE nik = ? AND password = ?';

        connection.query(query, [username, md5(password)], (error, results) => {
            if (error) {
                console.log('error login', error);
                return res.status(500).json({ error: 'Internal server error', status: false });
            }
            if (results.length === 0) {
                return res.status(401).json({ error: 'Invalid username or password', status: false });
            }
            const query_data = 'SELECT * FROM tb_penyewa where nik = ?';

            connection.query(query_data, [username], (error, results) => {
                if (error) {
                    console.log('error ambil data penyewa', error);
                    return res.status(500).json({ error: 'Internal server error', status: false });
                }
                return res. status(200).json({ success: true, data: results[0], status: true });
            })
        })
    } catch (error) {
        console.log('error login', error);
        return res.status(500).json({ error: 'Internal server error', status: false });
    }

})


module.exports = router