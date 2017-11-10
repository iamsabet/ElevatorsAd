var express = require('express');
var router = express.Router();
var favicon = require('serve-favicon');
var fs = require("fs"),
    rimraf = require("rimraf"),
    mkdirp = require("mkdirp");
var request = require('request');
var requsetIP = require('request-ip');
var download = require('download-file');
var http = require('http');
var querystring = require('querystring');
var dlPath ='C://Users/Mohammadreza/Desktop/client-middleware/Files/';


/* GET home page. */
router.get('/', function(req, res){
    res.send('client middleware API');
});


// routes

router.post("/downloadNotify",function (req,res){
    let downloadList = [];
    if(!Array.isArray(req.body.input)){
        downloadList.push(req.body.input);
    }
    else{
        downloadList = req.body.input;
    }
    let downloadUrl = 'http://localhost:3000/client/download/'; // admins ip
    for(let x in downloadList) {
        console.log(downloadList[x]);
        var data = querystring.stringify({
            input: downloadList[x],
        });

        // download files ...
        if(x === downloadList.length -1){
            res.send(true);
        }
    }
});
router.post("/deleteNotify",function (req,res){
    console.log(req.body.input);
    var deleteNotify = req.body.input;
    // do devare file ...
    if(deleteNotify) {
        for (var x in deleteNotify)
            console.log(x + " -- " + deleteNotify[x]);
        res.send(true);
    }
    else {
        res.send(false);
    }
});
module.exports = router;
