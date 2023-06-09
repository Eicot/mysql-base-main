const express = require('express'); //require in Express
const router = express.Router();

router.get('/', function(req,res){
    res.render("landing/home")
})

router.get('/about-us',function(req,res){
    res.render("landing/about-us");
})

router.get('/contact-us', function(req,res){
    res.render("landing/contact-us");
})

module.exports = router;