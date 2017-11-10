let express = require('express');
let router = express.Router();
let mongoose = require('mongoose');
let Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
let Ad = require('../models/Ads.model').schema;
let Client = require('../models/client.model').schema;
let requestIp = require('request-ip');
let http = require('http');
let request = require('request');

router.get('/', function(req, res, next) {
    let adminIp = requestIp.getClientIp(req);
    checkAuthority(adminIp,function(result){
       if(result === 'admin'){
           res.render('admin.html');
       }
       else{
           res.send('Not Found 404');
       }
    });
});

router.post('/clients', function(req, res) {
    let adminIp = requestIp.getClientIp(req);
    checkAuthority(adminIp,function(result){
        if(result === 'admin'){
            Client.methods.getClients(req, res, function (err) {
                if(err) throw err;
            });
        }
        else{
            res.send('Not Found 404');
        }
    });
});
router.post('/adds', function(req, res) {
    let adminIp = requestIp.getClientIp(req);
    checkAuthority(adminIp,function(result){
        if(result === 'admin'){
            let destIp = req.body.destIp;
            Ad.methods.getAds(req,res,destIp,function(err){
                if(err) throw err;
            });
        }
        else{
            res.send('Not Found 404');
        }
    });

});

router.post('/search-clients', function(req, res) {
    let adminIp = requestIp.getClientIp(req);
    let searchName = req.body.searchName;
    checkAuthority(adminIp,function(result) {
        if (result === 'admin') {
            Client.methods.searchClient(req, res, searchName, function (err) {

            });
        }
        else{
            res.send('Not Found 404');
        }
    });
});
router.post('/search-ads', function(req, res) {
    let adminIp = requestIp.getClientIp(req);
    checkAuthority(adminIp,function(result) {
        if (result === 'admin') {
            if (err) throw err;
        }
        else{
            res.send('Not Found 404');
        }
    });
});
router.post('/assign', function(req, res, next) {
    let adminIp = requestIp.getClientIp(req);
    let ipList = req.body.ipList;
    let idList = req.body.idList;
    checkAuthority(adminIp,function(result) {
        if (result === 'admin') {
            Client.methods.assignAd(req, res, ipList, idList, function (err) {
                if (err) throw err;
            });
        }
    else{
            res.send('Not Found 404');
        }
    });
});
router.post('/unAssign', function(req, res, next) {
    let adminIp = requestIp.getClientIp(req);
    let destIp = req.body.destIp;
    let deleteId = req.body.deleteId;
    console.log(destIp  +  " -- " + deleteId);
    checkAuthority(adminIp,function(result) {
        if (result === 'admin') {
            Client.methods.removeAssign(req, res, destIp, deleteId, function (err) {
                if (err) throw err;
            });
        }
        else{
            res.send('Not Found 404');
        }
    });
});
router.post('/available', function(req, res, next) {
    let adminIp = requestIp.getClientIp(req);
    let destIp = req.body.destIp;
    let destId = req.body.destId;

    checkAuthority(adminIp,function(result) {
        if(result === 'admin'){
            if(destIp !== 'N'){
                Ad.methods.getAvailableAds(req,res,destIp);
            }
            if(destId !== 'N'){
                Ad.methods.getAvailableClients(req,res,destId);
            }
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