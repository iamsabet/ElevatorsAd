var mongoose = require('mongoose');
var Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
var request = require('ajax-request');
mongoose.connect('mongodb://localhost/ElevatorAds_db', { useMongoClient: true , autoIndex :true});
var http = require('http');
var fs = require('fs');
var querystring = require('querystring');
var requestIp = require('request-ip');

var clientSchema = Schema({
    name: String,
    ip : String,
    adsList : [], // list of adds_ids
    lastUpdate : Date,
    role : String,
    storage : String,
    status:String ,
    nowPlaying : String,
    playList : [], // local adds_fileNames

});
clientSchema.methods.connectToServer = function (req,res,clientId,callback) {
    let clientIp = requestIp.getClientIp(req);
    let response = {};
    checkAuthority(clientIp,function (results) {
        if(results==="client" || results==="admin") {
            Client.find({ip: clientIp}, function (err, result) {
                if (err) throw err;
                console.log(result.length);
                if (result.length === 0) {
                    response.statusCode = 200;
                    response.message = "Connect Ok";
                    let client = new Client({
                        name: "Client - " + clientIp,
                        ip: clientIp,
                        lastUpdate: Date.now(),
                        role: "User",
                        adsList: [],
                        storage: 13.0,// 13 GBs
                        status:"Disconnected",
                        playList : [],
                        nowPlaying: "",
                    });
                    console.log(results);
                    if(results === "admin"){
                        client.role = "Admin";
                        client.name = "Admin";
                        client.storage = 100.0; // GBs
                        client.save(function (err) {
                            if (err) throw (err);
                            response.status = true;
                            return response;

                        });
                    }
                    else {
                        client.save(function (err) {
                            if (err) throw (err);
                            response.status = true;
                            return response;
                        });
                    }
                }
                if (result.length === 1) {
                    response.statusCode = 202;
                    response.message = "Accepted";
                    result[0].status = "Connected";
                    result[0].save(function(err){
                        if(err) throw err;
                        response.status = true;
                        return response;
                    });
                }
            });
        }
        else {
            response.statusCode = 404;
            response.status = false;
            response.message = "Not Found";
            return response;
        }
        return response;
    });
};
clientSchema.methods.disconnectFromServer = function (req,res,returnValue) {
    let clientIp = requestIp.getClientIp(req);
    let response = {};
    checkAuthority(clientIp, function (result) {
        if (result === "client" || result === "admin") {
            Client.update({ip: clientIp},{status:"Disconnected"}, function (err, result) {
                if (err) throw err;
                console.log(result);
                if(result){
                    response.statusCode = 200;
                    response.status = true;
                    response.message = "Disconnected";
                    returnValue(response);
                }
                else{
                    response.statusCode = 404;
                    response.status = false;
                    response.message = "Not Found";
                    returnValue(response);
                }
            });
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
    console.log(adIds);
    for(let x = 0 ; x < destIps.length ; x ++) {
        for (let y = 0; y < adIds.length; y++) {
            Client.updateOne({ip: "::ffff:" + destIps[x]}, {$addToSet: {adsList: adIds[y]}}, function (err, result) {
                if(err) throw err;
                if(result) {
                    getAdsNames(req,res,adIds,function(err,callback) {
                        if (err) throw err;
                        if (callback.length > 0) {
                            clientSchema.methods.updatePlayList(req, res, callback, function (err, results) {
                                if (err) throw err;
                                sendNotify('localhost', 'downloadNotify', adIds, res);
                            });
                        }
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
                    sendNotify('localhost', 'deleteNotify', idList,res);
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
clientSchema.methods.updatePlayList = function(req,res,input,results) { // input = namesList
    let clientIp = requestIp.getClientIp(req);
    checkAuthority(clientIp, function (result) {
        if (result === "admin" || result === "client") {
            console.log('input : ' + input);
            var nameList = [];
            if (!Array.isArray(input)) {
                nameList.push(input);
            }
            else {
                nameList = input;
            }
            console.log(nameList);
            Client.update({ip: clientIp},{$set: {playList: nameList}}, function (err, list) {
                if (err) throw err;
                if(list){
                    results(true);
                }
            });
        }
        else{
            results(false);
        }
    });

};
clientSchema.methods.getPlayList = function(req,res) {
    let clientIp = requestIp.getClientIp(req);
    checkAuthority(clientIp, function (result) {
        if (result === "admin" || result === "client") {
            Client.find({ip: clientIp}, function (err, list) {
                console.log(list);
                if (err) throw err;
                if(list.length > 0){
                    res.send(list.playList);
                }
            });
        }
        else{
            res.send('Not Found - 404');
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

function sendNotify(destIp,path,input,res){
    var ads = require('../models/Ads.model');
    console.log('input : ' +input);
    var downloadList = [];
    console.log('Send notify - '+ path);
    if(!Array.isArray(input)){
        downloadList.push(input);
    }
    else{
        downloadList = input;
    }
    console.log(downloadList);
    ads.find({id:{$in:downloadList}},function(err,list) {
        if (err) throw err;
        if (list.length > 0) {
            var options = {
                host: `${destIp}`,
                port: 1212,
                path: `/${path}`,
                method: 'POST',
                headers: {
                    'Content-Type': "application/x-www-form-urlencoded"
                },
            }
        };
        let notifList = [];
        for (var x = 0; x < list.length; x++) {
            notifList.push(list[x].name.toString());
            console.log(list[x].name.toString());
            if (x === list.length - 1) {
                console.log("list of names : " + list);
                var req = http.request(options, function (err, res) {

                });
                console.log(notifList);
                var data = querystring.stringify({
                    notifList: notifList,
                });
                req.write(data);
                req.end();
                res.send(true);
            }
        }
    });
};

function getAdsNames(req,res,idList,callback){
    var ads = require('../models/Ads.model');
    console.log('input : ' +idList);
    var downloadList = [];
    console.log('Send notify - '+ path);
    if(!Array.isArray(idList)){
        downloadList.push(idList);
    }
    else{
        downloadList = idList;
    }
    console.log(downloadList);
    ads.methods.getAdsNames(req,res,idList,function(result){
        if(err) throw err;
        if(result.length > 0){
            console.log(result);
            callback(result);
        }
        else{
            callback(result);
        }
    });
};

