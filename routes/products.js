
const express = require('express'); //require in Express
const router = express.Router();

router.get('/add', function(req,res){
    res.send("Add new product");
})


module.exports = router;