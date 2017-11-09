var express = require('express');
var mongoose = require("mongoose");
mongoose.connect('mongodb://localhost/ElevatorAds_db', { useMongoClient: true , autoIndex :true});
var router = express.Router();
var client = require('../models/client.model').schema;
var requestIp = require('request-ip');
var path = require('path');
/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('client.html');
});
router.get('/connect', function(req, res, next) {
    client.methods.connectToServer(req,res,function(returnValue){
        res.send(returnValue);
    });
});
router.get('/checkUpdate', function(req, res, next) {
    client.methods.checkUpdate(req,res,function(clientAdsList){
        res.send(clientAdsList);
    });
});
router.get('/download/:adName', function(req, res, next) {
    var adName = req.params.adName;
    var clientIp = requestIp.getClientIp(req);
    checkAuthority(clientIp,function(result){
        if(result==='admin' || result === 'client'){
            res.sendFile('C:/Users/Mohammadreza/Desktop/ElevatorAds/Ads/'+adName);
        }
        else{
            res.send('Not Fond - 404');
        }
    });
});

module.exports = router;

function checkAuthority(clientIp,callback){
    if(clientIp.startsWith("::1")){
        callback('admin');
    }
    else if(clientIp.startsWith("::ffff:192.168")){ //
        callback('client');
    }
    else callback('false');
};