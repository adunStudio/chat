/**
 * Created by hong on 2016-05-03.
 */

define(['socketio', 'socketiostream'], function(io, ss) {

    var ChatClient = Class.extend({
        init: function(host, port, userName) {
            this.socket = null;
            this.ss = null;

            this.id = null;
            this.host = host;
            this.port = port;
            this.name = userName;

            this.isListening = false;

            this.connected_callback = null;                              // 처음 연결시 최초 한번 실행.

            this.handlers = [];
            this.handlers[Types.Messages.WELCOME] = this.receiveWelcome;   // 서버 응답
            this.handlers[Types.Messages.CHAT] = this.receiveChat;         // 채팅 응답
            this.handlers[Types.Messages.SUCCESS] = this.receiveSuccess;      // 성공 응답
            this.handlers[Types.Messages.NOTICE] = this.receiveNotice;      // 공지 응답
            this.handlers[Types.Messages.FILEPATH] = this.receiveFilePath;      // 공지 응답

            this.$file = $('#file');
            this.$progress_div = $('#progress_div');
            this.$progress = $('#progress');
            this.$progress_text = $('#progress_text');

            this.enable();
        },

        enable: function() {
            this.isListening = true;
        },

        connect: function() {
            var url = this.host + ":" + this.port + "/";
            var self = this;
            console.log("서버연결 시도중... " + url);

            this.socket = io.connect(url);

            this.socket.on('connect', function() {
                console.log('서버연결 완료.');
                self._ss = ss
            });

            this.socket.on('reconnect', function() {
                alert('서버에 다시 연결합니다.');
                location.reload();
            });

            this.socket.on('error', function (data) {
                alert('error');
            });

            this.socket.on('connect_error', function (data) {
                alert('일시적인 서버문제로 새로고침됩니다.');
                location.reload();
            });

            this.socket.on('message', function(data) {
                if(data == 'go') {
                    if(self.connected_callback) {
                        self.connected_callback();
                    }
                    return;
                }

                self.receiveMessage(data);
            });

        },

        onConnected: function(callback) {
            this.connected_callback = callback;
        },

        receiveMessage: function(message) {
            var data;

            if(this.isListening) {
                data = JSON.parse(message);
            }

            if(data instanceof Array) {
                if(data[0] instanceof  Array) {
                    this.receiveActionBatch(data);
                } else {
                    this.receiveAction(data);
                }
            }
        },

        receiveAction: function(data) {                                             // 데이터가 한 개일 경우
            var action = data[0];

            if(this.handlers[action] && _.isFunction(this.handlers[action])) {
                this.handlers[action].call(this, data);
            } else {
                alert("Unknown Action: " + action);
            }
        },

        receiveActionBatch: function(datas) {                                       // 데이터가 여러 개 일 경우
            var self = this;

            _.each(datas, function(data) {
                self.receiveAction(data);
            });
        },

        sendMessage: function(json) {
            var data = JSON.stringify(json);
            this.socket.emit('message', data);
        },

        sendHello: function() {
            this.sendMessage([Types.Messages.HELLO, this.name]);
        },

        onWelcome: function(callback) {
            this.welcome_callback = callback;
        },
        receiveWelcome: function(data) {
            var name = data[1];
            var id = this.id = data[2];
            if(this.welcome_callback) {
                this.welcome_callback(name, id);
            }
        },

        onChat: function(callback) {
            this.chat_callback = callback;
        },
        receiveChat: function(data) {
            var name = data[1];
            var id = data[2];
            var text = data[3];

            if(this.chat_callback) {
                this.chat_callback(name, id, text);
            }
        },

        sendChat: function(text) {
            this.sendMessage([Types.Messages.CHAT, text]);
        },


        sendRoom: function(room) {
            this.sendMessage([Types.Messages.ROOM, room]);
        },

        upload: function(file, stream, option) {
            var self = this;

            this._ss(this.socket).emit(Types.Files.UPLOAD, stream, option);
            this._ss.createBlobReadStream(file).pipe(stream);

            var blobStream = this._ss.createBlobReadStream(file);
            var size = 0;

            this.$progress_div.show();
            this.$file.fadeOut('slow', function() {
                $(this).val('');
            });

            blobStream.on('data', function(chunck) {
                size += chunck.length;

                var percent = size / file.size * 100;

                self.$progress.width(percent + '%');
                self.$progress_text.text(percent + '%');

                if(percent == 100) {
                    self.$file.fadeIn('slow');
                    self.$progress_div.fadeOut('slow', function() {
                        self.$progress.width('0%');
                    });

                }
            });
        },

        onSuccess: function(callback) {
            this.success_callback = callback;
        },

        receiveSuccess: function() {
            if(this.success_callback){
                this.success_callback();
            }
        },

        onNotice: function(callback) {
            this.notice_callback = callback;
        },

        receiveNotice: function(data) {
            var text = data[1];
            if(this.notice_callback){
                this.notice_callback(text);
            }
        },


        onFilePath: function(callback) {
            this.filePath_callback = callback;
        },
        receiveFilePath: function(data) {
            var size = data[1];
            var filename = data[2];
            var filePath = data[3];

            if(this.filePath_callback) {
                this.filePath_callback(size, filename, filePath);
            }
        }


    });


    return ChatClient;
});