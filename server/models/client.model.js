var mongoose = require('mongoose');
var Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
var Ad = require('../models/Ads.model');
var request = require('ajax-request');
mongoose.connect('mongodb://localhost/ElevatorAds_db', { useMongoClient: true , autoIndex :true});
var http = require('http');
var fs = require('fs');
var querystring = require('querystring');
var requestIp = require('request-ip');

var clientSchema = Schema({
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
                        Ad.find({id: adId}, function (err, ad) {
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
                if(y===adIds.length-1){
                    clientSchema.methods.sendNotify('localhost','downloadNotify',adIds,function(result){ //destIps[x]
                        console.log("send download notify" + result);
                        res.send(JSON.stringify(result));
                    });
                }
            });
        }
    }
};
clientSchema.methods.removeAssign = function(req,res,ip,id){
    var adId = id;
    let clientIp = requestIp.getClientIp(req);
    checkAuthority(clientIp, function (result) {
        if (result === "admin") {
            Client.updateOne({ip: '::ffff:' + ip}, {$pull: {adsList: id}}, function (err, result) {
                if (err) throw err;
                if (result) {
                    var idList = [];
                    idList.push(adId);
                    clientSchema.methods.sendNotify('localhost', 'deleteNotify', idList, function (results) {
                        res.send(result);
                    });
                }
            });
        }
        else {
            res.send('Not Found - 404');
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
clientSchema.methods.sendNotify = function(destIp,path,input,results){

    var data = querystring.stringify({
        input: input,
    });

    var options = {
        host: `${destIp}`,
        port:1212,
        path:`/${path}`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        }
    };

    var req = http.request(options, function(res) {
        res.setEncoding('utf8');
        results(res);
    });

    req.write(data);
    req.end();


};

clientSchema.methods.searchClient = function(req,res,searchName){
    let regexp = new RegExp("^" + searchName);
    Client.find({name: regexp}, function (err, list) {
        if (err) throw err;
        console.log(list);
        res.send(list);
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
}

