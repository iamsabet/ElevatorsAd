let express = require('express');
let router = express.Router();
let favicon = require('serve-favicon');
let fs = require("fs"),
    rimraf = require("rimraf"),
    mkdirp = require("mkdirp");
let request = require('request');
let requsetIP = require('request-ip');
let download = require('download-file');
let http = require('http');
var del = require('del');
var dlPath ='C://Users/Mohammadreza/Desktop/client-middleware/Files/';

/* GET home page. */
router.get('/', function(req, res){
    res.send('client middleware API');
});


// routes

router.post("/downloadNotify",function (req,res) {
    let downloadList = [];
    console.log('Download Notify');
    if (!Array.isArray(req.body.notifList)) {
        downloadList.push(req.body.notifList);
    }
    else {
        downloadList = req.body.notifList;
    }
    let downloadUrl;
    console.log(downloadList);
    for (let x in downloadList) {
        console.log(downloadList[x]);
        var options = {
            directory: "Files/",
            filename: downloadList[x].name
        };
        downloadUrl = 'http://localhost:6985/' + downloadList[x];// admins ip
        download(downloadUrl, options, function (err) {
            if (err) throw err;
            console.log("Download Completed");
        });
    }
    res.send(true);
});
router.post("/deleteNotify",function (req,res) {
        var deleteList = req.body.notifList;
        var dList = [];
        console.log('Delete Notify');
        if (!Array.isArray(deleteList)) {
            dList.push(deleteList);
        }
        else {
            dList = deleteList;
        }
        console.log(dList);
        // do delete file ...
        for (var x in dList) {
            if (dList !== 'undefined') {
                del.sync(['Files/'+dList[x], '!public/assets/goat.png'],function(){
                    console.log('File - '+dList[x] +'   deleted !');
                });
                if(x === dList.length - 1 ){
                    res.send(true);
                }
            }
            else {
                res.send(false);
            }
        }
    }
);
module.exports = router;
