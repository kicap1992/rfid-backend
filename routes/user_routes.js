const express = require('express');
const router = express.Router();
const dotenv = require('dotenv');
const mysql = require('mysql');

dotenv.config();

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
})


router.get('/log_user/:nik', async (req, res) => {
    const { nik } = req.params;
    try {
        const query = 'SELECT * FROM tb_penyewa where nik = ?';
        connection.query(query, [nik], (error, results) => {
            if (error) {
                console.log('error cek log user', error);
                return res.status(500).json({ message: 'Internal server error', status: false });
            }

            if (results.length == 0) {
                return res.status(404).json({ message: 'User not found', status: false });
            }

            const query_log = 'SELECT * FROM tb_log_history a join tb_penyewa b on a.nik = b.nik where b.nik = ?';

            connection.query(query_log, [nik], (error, results_log) => {
                if (error) {
                    console.log('error cek log user', error);
                    return res.status(500).json({ message: 'Internal server error', status: false });
                }
                return res.status(200).json({ success: true, data: results_log, status: true });
            })

            // return res.json({ success: true, data: results ,status : true});
        })
    } catch (error) {
        console.log('error cek log user', error);
        return res.status(500).json({ message: 'Internal server error', status: false });
    }

})

router.get('/tempat_sewa/:nik', async (req, res) => {
    const { nik } = req.params;
    try {
        const query = 'SELECT * FROM tb_tempat_sewa a join tb_penyewa b on a.nik=b.nik where b.nik = ?';
        connection.query(query, [nik], (error, results) => {
            if (error) {
                console.log('error cek tempat sewa', error);
                return res.status(500).json({ message: 'Internal server error', status: false });
            }
            return res.status(200).json({ success: true, data: results, status: true });
        })
    } catch (error) {
        console.log('error cek tempat sewa', error);
        return res.status(500).json({ message: 'Internal server error', status: false });
    }

})


router.get('/user/:nik', async (req, res) => {
    const { nik } = req.params;
    try {
        const query = 'SELECT * FROM tb_penyewa where nik = ?';
        connection.query(query, [nik], (error, results) => {
            if (error) {
                console.log('error cek user', error);
                return res.status(500).json({ message: 'Internal server error', status: false });
            }
            if (results.length == 0) {
                return res.status(404).json({ message: 'User not found', status: false });
            }
            return res.status(200).json({ success: true, data: results[0], status: true });
        })
    } catch (error) {
        console.log('error cek user', error);
        return res.status(500).json({ message: 'Internal server error', status: false });
    }

})

module.exports = router



