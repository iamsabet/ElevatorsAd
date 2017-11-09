var fs = require("fs"),
    rimraf = require("rimraf"),
    mkdirp = require("mkdirp");
var express = require("express");
var app = express();
var request = require('request');
var requsetIP = require('request-ip');
var fs = require('fs');
var download = require('download');
app.get('/', function(req, res){
    res.send('hello world');
});
app.post('/update', function(req, res){
    var dowList = req.body.downloadList;
    var clientIp = requsetIP.getClientIp(req);
    if(clientIp==='::1'){ // server static ip
        console.log(JSON.stringify(dowList));
    }
});
var port = 1212;
// Only works on 3000 regardless of what I set environment port to or how I set [value] in app.set('port', [value]).
app.listen(port,function(){
    console.log('client service is running on port : '+port);
});

dlPath ='C://Users/Mohammadreza/Desktop/ElevatorAds/client/Ads/';
// routes


app.post("/downloadNotify",function (req,res,downloadList){
    var downloadUrl = 'http://localhost:3000/client/download/';
        for(let x = 0 ; x < downloadList ; x++) {
            download(downloadUrl + downloadList[x]).then(data => {
                fs.writeFileSync(dlPath + downloadList[x], data);
                x++;
            });
        }
});
app.post("/deleteNotify",function (req,res,deleteFileName){
        // delete
});

