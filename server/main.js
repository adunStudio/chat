/**
 * Created by hong on 2016-05-03.
 */

var fs = require('fs');
var configPath = "./config.json";   // 서버 설정 파일
var JOINSDB = require('./db');


function main(config) {
    var Joins = require("./chatserver");
    var Log = require('log');
    var _ = require('underscore');
    var User = require('./user');
    var JOINSDB = require('./db');


    var DB =  new JOINSDB.DB();  // DB
    var chat = new Joins.ChatServer(config.port, config.downport, DB);  // 채팅 서버

    switch(config.debug_level) {
        case "error":
            log = new Log(Log.ERROR); break;
        case "debug":
            log = new Log(Log.DEBUG); break;
        case "info":
            log = new Log(Log.INFO); break;
    }

    log.info("조인스채팅 서버를 시작합니다...");

    chat.onConnect(function(socket) {
        new User(socket, chat, DB);
    });
}








function getConfigFile(path, callback) {
    fs.readFile(path, 'utf8', function(err, json_string) {
       if(err) {console.error("설정 파일을 오픈할 수 없습니다. -> " + err.path);}
        else {
           callback(JSON.parse(json_string));
       }
    });
}

getConfigFile(configPath, function(config) {
    main(config);
});