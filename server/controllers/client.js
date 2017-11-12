var express = require('express');
var mongoose = require("mongoose");
mongoose.connect('mongodb://localhost/ElevatorAds_db', { useMongoClient: true , autoIndex :true});
var router = express.Router();
var client = require('../models/client.model').schema;
var ads = require('../models/Ads.model');
var requestIp = require('request-ip');
var fs = require('fs');
/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('Client.html');
});
router.get('/connect', function(req, res, next) {
    res.send(client.methods.connectToServer(req,res));
});
router.get('/disconnect', function(req, res, next) {
    client.methods.disconnectFromServer(req,res,function(returnValue){
        res.send(returnValue);
    });
});
router.get('/checkUpdate', function(req, res, next) {
    client.methods.checkUpdate(req,res,function(clientAdsList){
        res.send(clientAdsList);
    });
});
router.post('/loadPlayList', function(req, res, next) { // download files service

    client.methods.updatePlayList(req,res,function(err){
        if(err) throw err;
    });
});
router.post('/download', function(req, res, next) { // download files service
    let adId = req.body.input;
    console.log(adId.toString());
    let clientIp = requestIp.getClientIp(req);
    checkAuthority(clientIp,function(result){
        if(result==='admin' || result === 'client') {
            ads.find({id:adId.toString()}, function (err,ad) {
                console.log(ad);
                if(ad) {
                    console.log(ad[0].name);
                    var file = fs.readFileSync('C:/Users/Mohammadreza/Desktop/ElevatorAds/Ads/'+ad[0].name, 'binary');
                    res.setHeader('Content-Length', file.length);
                    res.write(file, 'binary');
                    res.end();
                }
                else{
                    res.send('Not Found - 404 ');
                }
            });
        }
        else{
            res.send('Not Fond - 404');
        }
    });
});

module.exports = router;

function checkAuthority(clientIp,callback){
    if(clientIp.startsWith("::1") || clientIp.startsWith("::ffff:127.0.0.1")){
        callback('admin');
    }
    else if(clientIp.startsWith("::ffff:192.168")){ //
        callback('client');
    }
    else callback('false');
};

