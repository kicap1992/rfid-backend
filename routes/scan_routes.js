const express = require('express');
const router = express.Router();
const dotenv = require('dotenv');
const mysql = require('mysql');

const socket = require('../socket');
// const socket_client = socket.socket_client;
const io = socket.getIO();

// const io_sock = require("socket.io-client");


dotenv.config();

// const socket = io_sock("http://localhost:"+process.env.PORT);

// Connect to the MySQL database
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

router.post('/', (req, res) => {
    let { uid } = req.body;
    console.log('Emitting scan_dia event: ' + uid);
    io.emit('scan', uid); // Emitting event using the io instance
    // socket.emit('scan_dia', uid);
    // socket_client.emit('scan_dia', uid);
    return res.json({ success: true, uid: uid });
});

router.get('/tempat_sewa' , (req, res) => {
    const query = 'SELECT * FROM tb_tempat_sewa a join tb_penyewa b on a.nik=b.nik;';
    connection.query(query, (error, results) => {
        if (error) {
            console.log('error cek tempat sewa', error);
            return res.status(500).json({message : 'Internal server error' ,status : false});
        }
        return res.json({ success: true, data: results ,status : true});
    })
})

router.get('/id/:id' , (req, res) => {
    const { id } = req.params;
    const query = 'SELECT * FROM tb_tempat_sewa a join tb_penyewa b on a.nik=b.nik where b.rfid = ?';
    connection.query(query, [id], (error, results) => {
        if (error) {
            console.log('error cek id rfid', error);
            return res.status(500).json({message : 'Internal server error' ,status : false});
        }
        return res.json({ success: true, data: results ,status : true});
    })
})

router.post('/bayar' , (req, res) => {
    const { nik, id_tempat_sewa , rfid} = req.body;
    console.log(nik, id_tempat_sewa, rfid);
    const query_select = 'SELECT * FROM tb_tempat_sewa a join tb_penyewa b on a.nik=b.nik where b.rfid = ? and a.id_tempat_serwa = ? and b.nik = ?';
    connection.query(query_select, [rfid , id_tempat_sewa, nik], (error, results) => {
        if (error) {
            console.log('error cek id rfid', error);
            return res.status(500).json({message : 'Internal server error' ,status : false});
        }
        if (results.length === 0) {
            return res.status(401).json({message : 'Data tidak ditemukan' ,status : false});
        }
        // console.log(results[0]);
        const saldo_terdahulu = results[0].saldo;
        if (results[0].harga_sewa > saldo_terdahulu) {
            return res.status(401).json({message : 'Saldo tidak mencukupi' ,status : false });
        }
        const saldo_terkini = saldo_terdahulu - results[0].harga_sewa;
        const query_update = 'UPDATE tb_penyewa SET saldo = ? WHERE nik = ?';
        connection.query(query_update, [saldo_terkini, nik], (error, results_update) => {
            if (error) {
                console.log('error bayar', error);
                return res.status(500).json({message : 'Internal server error' ,status : false});
            }
            // console.log(results_update);
            const ket = 'Pembayaran Retribusi Dilakukan oleh penyewa : ' + results[0].nik+' - '+results[0].nama + ' - '+results[0].rfid + ' dengan tempat sewa : ' + results[0].nama_tempat_sewa+ '\nSaldo sebelumnya : ' + saldo_terdahulu + '\nSaldo setelah bayar : ' + saldo_terkini;
            const jenis = 'Pembayaran Retribusi';
            const query_log = 'INSERT INTO tb_log_history (nik, id_tempat_serwa, ket,jenis) VALUES (?, ?, ?, ?)';
            connection.query(query_log, [nik, id_tempat_sewa, ket, jenis], (error, results) => {
                if (error) {
                    console.log('error log', error);
                    return res.status(500).json({message : 'Internal server error' ,status : false});
                }
                return res.json({ success: true, data: results ,status : true , message : 'Pembayaran retribusi berhasil dilakukan'});
            })
        })
    })
})

router.get('/log' , (req, res) => {
    const query_log = 'SELECT * FROM tb_log_history a join tb_penyewa b on a.nik = b.nik'
    connection.query(query_log, (error, results) => {
        if (error) {
            console.log('error log', error);
            return res.status(500).json({message : 'Internal server error' ,status : false});
        }
        return res.json({ success: true, data: results ,status : true});
    })
})

router.get('/penyewa' , (req, res) => {
    const query_penyewa = 'SELECT * FROM tb_penyewa';
    connection.query(query_penyewa, (error, results) => {
        if (error) {
            console.log('error log', error);
            return res.status(500).json({message : 'Internal server error' ,status : false});
        }
        return res.json({ success: true, data: results ,status : true});
    })
})

router.post('/penyewa/:nik' , (req, res) => {
    const { nik } = req.params;
    const { topup } = req.body;
    const query_penyewa = 'SELECT * FROM tb_penyewa where nik = ?';
    // console.log(nik, topup);
    connection.query(query_penyewa, [nik], (error, results) => {
        if (error) {
            console.log('error log', error);
            return res.status(500).json({message : 'Internal server error' ,status : false});
        }
        if (results.length === 0) {
            return res.status(401).json({message : 'Data tidak ditemukan' ,status : false});
        }
        const saldo_terdahulu = results[0].saldo;
        // parse integer
        const saldo_terkini = parseInt(saldo_terdahulu) + parseInt(topup);
        // console.log(saldo_terkini, saldo_terdahulu);
        // console.log(results);

        const query_update = 'UPDATE tb_penyewa SET saldo = ? WHERE nik = ?';
        connection.query(query_update, [saldo_terkini, nik], (error, results_update) => {
            if (error) {
                console.log('error bayar', error);
                return res.status(500).json({message : 'Internal server error' ,status : false});
            }
            const query_log = 'INSERT INTO tb_log_history (nik, ket,jenis) VALUES (?, ?, ?)';
            const jenis = 'Top Up Saldo';
            const ket = 'Top Up Saldo dilakukan oleh penyewa : ' + results[0].nik+' - '+results[0].nama + ' - '+results[0].rfid + ' dengan nominal : ' + topup + '\nSaldo sebelumnya : ' + saldo_terdahulu + '\nSaldo setelah topup : ' + saldo_terkini;

            console.log(ket);
            console.log(jenis);


            connection.query(query_log, [nik, ket,jenis], (error, results_log) => {
                if (error) {
                    console.log('error log', error);
                    return res.status(500).json({message : 'Internal server error' ,status : false});
                }
                return res.json({ success: true,status : true , message : 'Top Up Saldo berhasil dilakukan'});
            })

            
        })
    })
})

router.put('/penyewa/:nik' , (req, res) => {
    const { nik } = req.params;
    const {nik_baru , nama} = req.body;

    const query_select = 'SELECT * FROM tb_penyewa where nik = ?';

    connection.query(query_select, [nik], (error, results) => {
        if (error) {
            console.log('error select', error);
            return res.status(500).json({message : 'Internal server error' ,status : false});
        }
        if (results.length === 0) {
            return res.status(401).json({message : 'Data tidak ditemukan' ,status : false});
        }
        const query_update = 'UPDATE tb_penyewa SET nik = ? , nama = ? WHERE nik = ?';
        connection.query(query_update, [nik_baru, nama, nik], (error, results_update) => {
            if (error) {
                console.log('error update data penyewa', error);
                return res.status(500).json({message : 'Internal server error' ,status : false});
            }
            return res.json({ success: true,status : true , message : 'Perubahan data penyewa berhasil dilakukan'});
        })
    })
})



module.exports = router;
