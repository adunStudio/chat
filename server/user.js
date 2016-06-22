var cls = require("./lib/class");
var _ = require("underscore");
var Types = require('./types');
var message = require('./message');
var path = require('path');
var fs = require('fs');
var iconv = require('iconv-lite');
iconv.extendNodeEncodings();

module.exports = User = cls.Class.extend({
    init: function(socket, server, db) {
        var self = this;

        this.db = db;
        this.id = socket.id;
        this.name = null;

        this._server = server;                           // => io
        this._socket = socket;                           // => socket

        this.room = null;

        this.ready = false;
        this.hasEnteredChat = false;

        this._socket.listen(function(message) {
            var action = parseInt(message[0]);
            log.info("메시지: " + message);

    /*       if(!self.hasEnteredChat && action !== Types.Messages.HELLO) {
                self._socket.close("ERROR: 처음메시지는 무조건 HELLO여야만 한다.: "+message);
                return;
            }*/

            if(action === Types.Messages.HELLO) {
                var name = message[1];
                self.name = name;
                this.ready = true;
                self.send([Types.Messages.WELCOME, self.name, self.id]);
                return;
            }

            if(!this.ready) { return;}

            if(action === Types.Messages.CHAT) {
                var text = message[1];

                self.broadcast([Types.Messages.CHAT, self.name, self.id, text], false);

                self.db._pool.getConnection(function(err, connection) {
                    if(err) {
                        connection.release();
                        console.log('db연결 실패');
                    }else {
                        var chat = {
                            room: self.room,
                            name: self.name,
                            txt: text
                        };

                        connection.query("insert into KHI_CHAT set ?", chat, function(err) {
                            if(err) {
                                connection.rollback(function () {
                                    console.log('롤백');
                                });
                            } else {
                                connection.commit(function(err) {
                                    if(err) {console.log('커밋 오류')}
                                })
                            }
                            connection.release();

                        });
                    }
                });

            }

            if(action === Types.Messages.ROOM) {
                var room = message[1];

                if(!self.room) {
                    self.room = room;
                    self.joinRoom(self.room);
                } else {
                    self.broadcast([Types.Messages.NOTICE, self.name + "님이 나가셨습니다."], true);
                    self.leaveRoom();
                    self.room = room;
                    self.joinRoom(self.room);
                }

                self._socket.setRoom(self.room);
                self._socket.send([Types.Messages.SUCCESS]);

                self.broadcast([Types.Messages.NOTICE, self.name + "님이 입장하셨습니다."], false);

            }

            if(action === Types.Messages.DOWN) {
                var filePath = message[1];

            }

        });

        this._socket.onClose(function() {
            self.broadcast([Types.Messages.NOTICE, self.name + "님이 나가셨습니다."], true);
        });

        this._socket.onUpload(function(stream, data) {
            var filename = path.basename(data.name);
            if(self.room) {
                var filePath = './upload/' + self.room + '/' +filename;
                //fs.existsSync(filePath) || fs.mkdirSync(filePath);
                var f = fs.createWriteStream(filePath);
                var s = stream.pipe(f);

                stream.on('end', function() {
                    console.log(filePath + " 전송완료");
                    self.broadcast([Types.Messages.FILEPATH, data.size, filename, self.room + '/' + filename], false);
                });

                self.db._pool.getConnection(function(err, connection) {
                    if(err) {
                        connection.release();
                        console.log('db연결 실패');
                    }else {
                        var file = {
                            room: self.room,
                            filepath: filePath,
                            filename: filename
                        };

                        connection.query("insert into KHI_FILE set ?", file, function(err) {
                            if(err) {
                                connection.rollback(function () {
                                    console.log('롤백');
                                });
                            } else {
                                connection.commit(function(err) {
                                    if(err) {console.log('커밋 오류')}
                                })
                            }
                            connection.release();

                        });
                    }
                });

            }
        });

        this._socket.onDown(function(stream, data) {
            var filePath = data.filePath;

            console.log("1111" +filePath);
            var f = fs.createReadStream(filePath);

            f.pipe(stream);


        });
    },

    send: function(message) {
        this._socket.send(message);
    },

    broadcast: function(message, ignoreSelf) {
        var ignore = ignoreSelf  === 'undefined' ? true : ignoreSelf;
        if(ignore) {
            if(this.room) {
                this._socket.broadcast(message, this.room);
            } else {
                this._socket.broadcast(message);
            }
        } else {
            if(this.room) {
                this._server.broadcast(message, this.room);
            }else {
                this._server.broadcast(message);
            }
        }
    },

    joinRoom: function(room) {
        this.room = room;
        this._socket.joinRoom(this.room);
    },

    leaveRoom: function() {
        this._socket.leaveRoom(this.room);
        this.room = null;
    }

});