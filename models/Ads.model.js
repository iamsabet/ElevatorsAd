let mongoose = require('mongoose');
let Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
let random = require('randomstring');
let path = 'C://Users/Mohammadreza/Desktop/ElevatorAds/';
let probe = require('node-ffprobe');

let clientSchema = require('../models/client.model').schema;
mongoose.connect('mongodb://localhost/ElevatorAds_db', { useMongoClient: true , autoIndex :true});
let requestIp = require('request-ip');
let adsSchema = Schema({
    id : String,
    name: String,
    type:String,
    format:String,
    lastUpdate : Date,
    thumbnail : String,
    playedTimes : Number,
    time : Number , // seconds
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
        time: 10,
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
        var adminIp = requestIp.getClientIp(req);
        checkAuthority(adminIp, function (result) {
            if (result === 'admin') {
                client.findOne({ip: '::ffff:' + destIp}, function (err, destClient) {
                    if (err) throw err;
                    if(destClient) {
                        adsSchema.methods.getAdsByList(destClient.adsList, function (result) {
                            res.send(result);
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
adsSchema.methods.getAdsByList = function(list,result){
    if(list) {
        Ad.find({id:{$in:list}},function(err,clientAdsList){
            result(clientAdsList);
        });
    }
    else{
        result([]);
    }
};
adsSchema.methods.getAvailableAds = function(req,res,destIp) {
    let adminIp = requestIp.getClientIp(req);
    checkAuthority(adminIp, function (result) {
        if (result === 'admin') {
            client.findOne({ip: '::ffff:' + destIp}, function (err, DestClient) {
                if (err) throw err;
                if (DestClient) {
                    var list = [];
                    list = DestClient.adsList;
                    console.log(list);
                    Ad.find({id:{$nin : list}},function(err,availableAds){
                        if (err) throw err;
                        console.log(availableAds);
                        res.send(availableAds);
                    });
                }
            });
        }
    });
};

adsSchema.methods.getAvailableClients = function(req,res,destId) {
    var adminIp = requestIp.getClientIp(req);
    checkAuthority(adminIp, function (result) {
        if (result === 'admin') {
            var destId = destId;
            client.find({adsList: {$ne: destId}}, function (err, availableClients) {
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
        console.log(list);
        res.send(list);
    });
};

adsSchema.methods.remove = function () {

};

adsSchema.pre('save', function(next) {
    this.lastUpdate = Date.now();
    next();
});

let Ad = mongoose.model('ads', adsSchema);
let client = mongoose.model('clients', clientSchema);
// make this available to our users in our Node applications
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