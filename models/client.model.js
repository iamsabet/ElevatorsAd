let mongoose = require('mongoose');
let Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
let client = require('../models/client.model').schema;
let ads = require('../models/Ads.model').schema;
let request = require('request');
mongoose.connect('mongodb://localhost/ElevatorAds_db', { useMongoClient: true , autoIndex :true});
let http = require('http');
let fs = require('fs');
let requestIp = require('request-ip');

let clientSchema = Schema({
    name: String,
    ip : String,
    adsList : [], // list of adds_file_names
    lastUpdate : Date,
    role : String,
    storage : String,
});
clientSchema.methods.connectToServer = function (req,res,returnValue) {
    let clientIp = requestIp.getClientIp(req);
    checkAuthority(clientIp,function (result) {
        if(result==="client" || result==="admin") {
            Client.find({ip: clientIp}, function (err, result) {
                if (err) throw err;
                let response = {};
                if (result.length === 0) {
                    response.statusCode = 200;
                    response.message = "Connect Ok";
                    let client = new Client({
                        name: "Client - " + clientIp,
                        ip: clientIp,
                        lastUpdate: Date.now(),
                        role: 'user',
                        adsList: [],
                    });
                    client.save(function (err) {
                        if (err) throw (err);
                        // saved!
                    })
                }
                if (result.length === 1) {
                    response.statusCode = 202;
                    response.message = "Accepted";
                }
                response.status = true;
                returnValue(response);
            });
        }
        else {
            res.send('Not Found 404');
        }
    });
};
clientSchema.methods.checkUpdate = function (req,res,clientAdsList) {
    let clientIp = requestIp.getClientIp(req);
    checkAuthority(clientIp, function (result) {
        if (result === "client") {
            Client.find({ip: clientIp}, function (err, result) {
                if (err) throw err;
                if (result.length === 1) {
                    clientAdsList(result[0].adsList);
                }
                else if (result.length === 0) {
                    res.status(401);
                    res.send({statusCode: 401, message: "Unauthorized", status: false});
                }
            });
        }
        else {
            res.send('Not Found 404');
        }
    });
};


clientSchema.methods.download = function(req,res,adId,callback) {
    let clientIp = requestIp.getClientIp(req);
    checkAuthority(clientIp, function (result) {
        if (result === "client" || result === "admin") {
            Client.find({ip: clientIp}, function (err, result) {
                if (err) throw err;
                if (result) {
                    if(result.adsList.contains(adId)) {
                        ads.find({id: adId}, function (err, ad) {
                            if (err) throw err;
                            callback(ad.name);
                            let x = request('http://localhost:1212/addId');

                        });
                    }
                }
                else {
                    res.send('Unauthorized');
                }
            });
        }
        else{
            res.send('Not Found 404');
        }
    });
};

clientSchema.methods.getClients = function(req,res) {
    Client.find({}, function (err, clients) {
        if (err) throw err;
        if (clients.length > 0) {
            res.send(clients);
        }
        else {
            res.send('Empty');
        }
    });
};


clientSchema.methods.checkUpdate = function (req,res) { // needs to be fixed - or delete
    let clientIp = requestIp.getClientIp(req);
    Client.find({ip: clientIp}, function (err, result) {
        if (err) throw err;
        if (result.length > 0) {
            res.send(result[0].adsList);
        }
        else{
            res.send([]);
        }
    });
};


clientSchema.methods.assignAd = function (req,res,destIps,adIds,result) {
    if(!Array.isArray(destIps)){
        destIps = destIps.split(',');
    }
    if(!Array.isArray(adIds)){
        adIds = adIds.split(',');
    }
    for(let x = 0 ; x < destIps.length ; x ++) {
        for (let y = 0; y < adIds.length; y++) {
            Client.updateOne({ip: "::ffff:" + destIps[x]}, {$addToSet: {adsList: adIds[y]}}, function (err, result) {
                console.log( destIps[x]+ " : - " + adIds[y]);
                if (err) throw err;
                let options = {
                    url: 'http://localhost:1212/downloadNotify', // client IP destination destIps[x] = localhost
                    method: 'POST',
                    data: {downloadList: Client.adsList}
                };
                // Start the request
                request(options, function (error, response, body) {
                    if (!error && response.statusCode === 200) {
                        console.log('err : '+err + " response : "+response + " body : " + body);
                        res.send(true);
                    }
                });
            });
        }
    }
};
clientSchema.methods.removeAssign = function(req,res,ip,id){
    let clientIp = requestIp.getClientIp(req);
    checkAuthority(clientIp, function (result) {
        if (result === "admin") {
            Client.updateOne({ip: '::ffff:' + ip},{$pull:{adsList:id}}, function (err, result) {
                if(err) throw err;
                if(result){
                    console.log(result);
                    var options = {
                        url: 'http://localhost:1212/deleteNotify', // client IP destination destIps[x] = localhost
                        method: 'POST',
                        data: {downloadList: Client.adsList}
                    };
                    // Start the request
                    request(options, function (error, response, body) {
                        if (!error && response.statusCode === 200) {
                            console.log(response);
                            res.send(true);
                        }
                    });
                }
                else{
                    res.send(false);
                }
            });
        }
    });
};
clientSchema.method.removeAllAssigns = function(req,res,ip,result){
    let clientIp = requestIp.getClientIp(req);
    checkAuthority(clientIp, function (result) {
        if (result === "admin") {
            Client.updateOne({ip: '::ffff:' + ip},{$set:{adsList:[]}}, function (err, result) {
                if(err) throw err;
                if(result){
                    res.send(true);
                }
            });
        }
    });
};
clientSchema.method.removeFromAll = function(req,res,id,result){
    let clientIp = requestIp.getClientIp(req);
    checkAuthority(clientIp, function (result) {
        if (result === "admin") {
            Client.updateOne({},{$pull:{adsList:id}}, function (err, result) {
                if(err) throw err;
                if(result){
                    res.send(true);
                }
            });
        }
    });
};
clientSchema.methods.searchClient = function(req,res,searchName){
    let regexp = new RegExp("^" + searchName);
    Client.find({name: regexp}, function (err, list) {
        if (err) throw err;
        console.log(list);
        res.send(list);
    });
};

clientSchema.methods.clearAds = function(req,res,clientIp){
    Client.find({ip: clientIp}, function (err, list) {
        if (err) throw err;
        if(list.length > 0) {
            list[0].adsList = [];
            list[0].save();
            res.send(true);
        }
        else{
            res.send(false);
        }
    });
};
clientSchema.pre('save', function(next) {
    this.lastUpdate = Date.now();
    next();
});

let Client = mongoose.model('clients', clientSchema);

// make this available to our users in our Node applications
module.exports = Client;
function checkAuthority(clientIp,callback){
    if(clientIp.startsWith("::1")){
        callback('admin');
    }
    else if(clientIp.startsWith("::ffff:192.168")){ //
        callback('client');
    }
    else callback('false');
};

