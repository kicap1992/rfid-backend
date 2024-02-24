const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
    let { uid } = req.body
    console.log(uid);
    return  res.json({ success: true , uid: uid})
})

module.exports = router;