/**
 * Created by hong on 2016-05-06.
 */

/*
 CREATE TABLE `KHI_CHAT` (
 `room` VARCHAR(50) NOT NULL,
 `name` VARCHAR(50) NOT NULL,
 `txt` TEXT NULL,
 `regitser_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
 )
 COLLATE='utf8_general_ci'
 ENGINE=MyISAM
 ;

 CREATE TABLE `KHI_FILE` (
 `room` VARCHAR(50) NULL DEFAULT NULL,
 `filepath` VARCHAR(50) NULL DEFAULT NULL,
 `filename` VARCHAR(50) NULL DEFAULT NULL,
 `register_date` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
 )
 COLLATE='utf8_general_ci'
 ENGINE=MyISAM
 ;


*/
var cls = require("./lib/class");
var mysql = require('mysql');


var JOINSDB = {};
module.exports = JOINSDB;

JOINSDB.DB = cls.Class.extend({
    init: function(){
        this.host = '';
        this.user = '';
        this.password = '';
        this.database = '' ;

        this._connection = null;

        this._pool = mysql.createPool({
            connectionLimit: 10,
            host: this.host,
            port: 3306,
            user: this.user,
            password: this.password,
            database: this.database
        });

       this._pool.getConnection(function(err, connection) {
           if(err) {
               console.log('db연결 실패');
           }else {
               this._connection = connection;
           }
       });
    },

    queryInsert: function(str) {
        if(!this._connection) {return;}
    },

    querySelect: function(str) {
        if(!this._connection) {return;}

    }
});