/**
 * Created by hong on 2016-05-03.
 */

var cls = require("./lib/class");
var _ = require("underscore");
var mysql = require('mysql');

var express = require('express');
var app = express();
var fs = require('fs');
var path = require('path');
var mime = require('mime');
var iconv = require('iconv-lite');
iconv.extendNodeEncodings();
var CORS = require('cors')();


var http = require('http').Server(app);
var io = require('socket.io')(http);
var Types = require('./types');

var JOINS = {};
module.exports = JOINS;

var Server = cls.Class.extend({
    init: function(port) {
        this.port = port;

        this._sockets = {};             // 연결된 소켓들
        this.connection_callback = null;   // 소켓 최초 연결시 호출할 콜백 함수


    },

    onConnect: function(callback) {
        this.connection_callback = callback;
    },

    addSocket: function(socket) {
        this._sockets[socket.id] = socket;
    },

    forEachSocket: function(callback) {
        _.each(this._sockets, callback);
    },

    removeSocket: function(id) {
        delete this._sockets[id];
    },

    getSocket: function(id) {
        return this._sockets[id];
    }
});

var Socket = cls.Class.extend({
    init: function(id, socket, server, ss) {
        this.id = id;
        this._socket = socket;
        this._server = server;
        this._ss = ss;
    },

    close: function(logError) {
        log.info("소켓 연결을 종료합니다.: ");
        this._socket.destory();
        //this._socket.close();
    }
});

JOINS.ChatServer = Server.extend({
    init: function(port, downport, db) {
        var self = this;


        this._super(port);
        this.db = db;

        this._app = express();
        this._http = require('http').Server(this._app);
        this._io = require('socket.io')(this._http);
        this._ss = require('socket.io-stream');

        this._app.set('port', downport);

        app.use(CORS);


        this._app.get('/download/:room/:fileName', function(req, res) {
            var filePath = __dirname + "/upload/" + req.params.room + "/" + req.params.fileName;

            fs.exists(filePath, function(exists) {
                if(exists) {
                    var fileName = path.basename(filePath);
                    var mimetype = mime.lookup(filePath);
                    res.setHeader('Content-disposition', 'attachment; filename=' + fileName);
                    res.setHeader('Content-type', mimetype);


                    var fileStream = fs.createReadStream(filePath);
                    fileStream.pipe(res);
                }else {
                    res.write("존재하지 않는 파일입니다.");
                    res.end();

                }

            });

        });

        this._app.get('/room/:room', function(req,res) {
            var room = req.params.room;

            self.db._pool.getConnection(function(err, connection) {
                if(err) {
                    connection.release();
                    console.log('db연결 실패');
                }else {
                   var sql = "SELECT * FROM KHI_CHAT WHERE room =" +mysql.escape(room);

                    connection.query(sql, function(err, rows) {
                        if(err) {
                            console.log(err);
                            connection.release();
                        } else {
                            res.jsonp(rows);
                            connection.release();
                        }

                    });
                }
            });
        });

        this._app.get('/file/:room', function(req, res) {
            var room = req.params.room;

            self.db._pool.getConnection(function(err, connection) {
                if(err) {
                    connection.release();
                    console.log('db연결 실패');
                }else {
                    var sql = "SELECT * FROM KHI_FILE WHERE room =" +mysql.escape(room);

                    connection.query(sql, function(err, rows) {
                        if(err) {
                            console.log(err);
                            connection.release();
                        } else {
                            res.jsonp(rows);
                            connection.release();
                        }

                    });
                }
            });
        });

        this._app.listen(self._app.get('port'), function () {
            console.log("http://localhost:'" + self._app.get('port') + '; press Ctrl-C to terminate.');
        });

        this._http.listen(port, function(){
            log.info("조인스채팅 서버 리스닝 ON * port: " + port );
        });

        this._io.on('connection', function(socket) {

            var ss = self._ss(socket);
            var chatSocket = new JOINS.ChatSocket(socket.id, socket, self, ss);


            if(self.connection_callback) {
                self.connection_callback(chatSocket);
            }
        });

    },

    broadcast: function(message, room) {                                             // 나를 포함한 모든 클라이언트들에게 이벤트 보내기
        var data = JSON.stringify(message);
        if(room) {
            console.log(data);
            this._io.sockets.in(room).emit('message', data);
        } else {
            this._io.sockets.emit('message', data);
        }
    }
});

JOINS.ChatSocket = Socket.extend({
    init: function(id, socket, server, ss) {
        var self = this;

        this.listen_callback = null;
        this.close_callback = null;

        this._super(id, socket, server, ss);

        this.room = null;

        this._ss.on(Types.Files.UPLOAD, function(stream, data) {
            if(self.upload_callback) {
                self.upload_callback(stream, data);
            }
        });

        this._ss.on(Types.Files.DOWN, function(stream, data) {
            console.log('다운로드요청');
            if(self.down_callback) {
                self.down_callback(stream, data);
            }
        });

        this._socket.on('message', function(message) {

            console.log(message);
            if(self.listen_callback) {
                self.listen_callback(JSON.parse(message));
            }
        });

        this.sendUTF8('go');

        this._socket.on('disconnect', function(socket) {
            if(self.close_callback) {
               self.close_callback();
           }
            console.log('나감');
            delete self._server.removeSocket(self.id);
        });


    },

    listen: function(callback) {
        this.listen_callback = callback;
    },

    onUpload: function(callback) {
        this.upload_callback = callback;
    },

    onDown: function(callback) {
        this.down_callback = callback;
    },

    onClose: function(callback) {
        this.close_callback = callback;
    },

    send: function(message) {                                      // 나에게 이벤트보내기
        var data = JSON.stringify(message);
        this._socket.emit('message', data);
        //this._socket.in(this.room).emit('message', data);
    },

    sendUTF8: function(data) {                                     // 나에게 이벤트 보내기 (순수 문자열을 보낸다.)
        this._socket.emit('message', data);
    },

    broadcast: function(data, room) {                            // 나를 제외한 다른 클라이언트들에게 이벤트 보내기
        if(room) {
            var data = JSON.stringify(data);
            this._socket.broadcast.to(room).emit('message', data);
        } /*else {
            this._socket.broadcast().emit('message', data);
        }*/
    },

    setRoom: function(room) {
        this.room = room;
    },

    joinRoom: function(room) {
        this._socket.join(room);
    },

    leaveRoom: function(room) {
        this._socket.leave(room);
    }
});
