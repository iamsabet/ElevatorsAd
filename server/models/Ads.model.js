var mongoose = require('mongoose');
var Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
var path = 'C://Users/Mohammadreza/Desktop/ElevatorAds/';
var Client = require('../models/client.model');
var http = require('http');
var fs = require('fs');
var querystring = require('querystring');
var del = require('del');
mongoose.connect('mongodb://localhost/ElevatorAds_db', { useMongoClient: true , autoIndex :true});
var requestIp = require('request-ip');
var adsSchema = Schema({
    id : String,
    name: String,
    type:String,
    format:String,
    lastUpdate : Date,
    thumbnail : String,
    playedTimes : Number,
    size:Number , // float in GBs
    duration : Number , // seconds
});

adsSchema.methods.update = function () {

};
adsSchema.methods.new = function (newAdd) {


    let ad = new Ad({
        id: newAdd.id,
        name : newAdd.name,
        type : newAdd.type || 'video',
        playedTimes :0,
        thumbnail : '',
        //video time = time / images = show time
        duration: 10,
        size : 1.2 , //GBs
        format : newAdd.name.split('.')[newAdd.name.split('.').length -1],
    });
    ad.save(function (err) {
    });
};

adsSchema.methods.getAds = function(req,res,destIp,callback) {
    if (destIp === "") {
        Ad.find({}, function (err, adsList) {
            if (err) throw err;
            res.send(adsList);
        });
    }
    else {
        let adminIp = requestIp.getClientIp(req);
        checkAuthority(adminIp, function (result) {
            if (result === 'admin') {
                Client.findOne({ip: '::ffff:' + destIp}, function (err, destClient) {
                    if (err) throw err;
                    if(destClient) {
                        adsSchema.methods.getAdsByList(req,res,destClient.adsList, function (results) {
                            res.send(results);
                        });
                    }
                    else{
                        res.send([]);
                    }
                });
            }
        });
    }
};
adsSchema.methods.getAdsByList = function(req,res,list,results){
    let clientIp = requestIp.getClientIp(req);
    console.log(list);
    checkAuthority(clientIp, function (result) {
        if (result === 'admin' || result === 'client') {
            if (list) {
                Ad.find({id: {$in: list}}, function (err, ads) {
                    results(ads);
                });
            }
            else {
                results([]);
            }
        }
    });
};

adsSchema.methods.getAvailableAds = function(req,res,destIp) {
    let adminIp = requestIp.getClientIp(req);
    checkAuthority(adminIp, function (result) {
        if (result === 'admin') {
            Client.findOne({ip: '::ffff:' + destIp}, function (err, DestClient) {
                if (err) throw err;
                if (DestClient) {
                    var list = DestClient.adsList;
                    Ad.find({id:{$nin : list}},function(err,availableAds){
                        if (err) throw err;
                        res.send(availableAds);
                    });
                }
            });
        }
    });
};
adsSchema.methods.getAdsNames = function(req,res,idList,results){
    let adminIp = requestIp.getClientIp(req);
    checkAuthority(adminIp, function (result) {
        if (result === 'admin') {
            let nameList = [];
            Ad.find({id:{$in : idList}},function(err,ads){
                if (err) throw err;
                if(ads) {
                    for (let x in ads) {
                        nameList.push(ads[x]);
                        if (x === ads.length - 1) {
                            results(nameList);
                        }
                    }
                }
                else{
                    results(false);
                }
            });
        }
    });
};
adsSchema.methods.getAvailableClients = function(req,res,destId) {
    let adminIp = requestIp.getClientIp(req);
    checkAuthority(adminIp, function (result) {
        if (result === 'admin') {
            Client.find({adsList: {$ne: destId}}, function (err, availableClients) {
                if (err) throw err;
                res.send(availableClients);
            });
        }
    });
};

adsSchema.methods.searchAds = function(req,res,searchName){
    let regexp = new RegExp("^" + searchName);
    Ad.find({name: regexp}, function (err, list) {
        if (err) throw err;
        res.send(list);
    });
};

adsSchema.methods.remove = function (req,res,nameList,idList) {
    for (var x in nameList) {
        if (nameList !== 'undefined') {
            del.sync(['Files/'+nameList[x], '!public/assets/goat.png'],function(){
                console.log('File - '+nameList[x] +'   deleted !');
            });
            if(x === nameList.length - 1 ){
                Client.update({},{$pull:{adsList:{$in:idList}}},function(err,result1){
                    if(err) throw err;
                    console.log(result1 + "\n Removed From All clients.adsList");
                    Ad.remove({id:{$in:idList}},function(err,result2){
                        if(err) throw err;
                        console.log(result2);
                        console.log(result1 + "\n Removed Ads Objects in db");
                        res.send(true);                    });
                });
            }
        }
        else {
            res.send(false);
        }
    }
};

adsSchema.pre('save', function(next) {
    this.lastUpdate = Date.now();
    next();
});

// make this available to our users in our Node applications
let Ad = mongoose.model('ads', adsSchema);
module.exports = Ad;
function checkAuthority(clientIp,callback){
    if(clientIp.startsWith("::1")){
        callback('admin');
    }
    else if(clientIp.startsWith("::ffff:192.168")){ //
        callback('client');
    }
    else callback('false');
};