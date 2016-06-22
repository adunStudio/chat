/**
 * Created by hong on 2016-05-03.
 */

define(['chatclient', 'config2'], function(ChatClient, config) {

    var Chat = Class.extend({
        init: function(app) {
            this.app = app;
            this.app.config = config;

            this.host = null;
            this.port = null;
            this.downport = null;
            this.userName = null;
            this.id = null;

            this.room = null;
            this.defaultRoom = '1room';

            this.ready = false;
            this.started = false;


            this.$loading_div = $('#loading_div');
            this.$chat_div = $('#chat_div');
            this.$form = $('#f');                       // 글쓰기 폼
            this.$messageList = $('#messages');       // 채팅 ul
            this.$input = $('#m');                     // input text
            this.$room = $('#room');                   // 룸
            this.$file = $('#file');
            this.$filePath = $('#messages .file');
            this.$fileList = $('#fileList');





        },

        setServerOption: function(host, port, downport) {
            this.host = host;
            this.port = port;
            this.downport = downport;
        },



        connect: function() {
            var self = this;
            var connectiong = false;

            this.client = new ChatClient(this.host, this.port, this.userName);

            this.client.connect();

            this.client.onConnected(function() {
                console.log("서버 응답 확인.");

                //self.player.name = self.username;
                self.started = true;
                self.client.sendHello();
            })
        },

        run: function() {
            var self = this;

            while(!this.userName) {
                this.userName = prompt("닉네임을 입력하세요.");
            }

            this.connect();

            this.client.onChat(function(name, id, text) {
                if(!self.started) {return;}
                if(self.id == id) {
                    self.$messageList.append($('<li class="me">').text(name + ": " + text));
                } else {
                    self.$messageList.append($('<li>').text(name + ": " + text));
                }

            });

            this.client.onWelcome(function(name, id) {
                self.blink(true);
                self.id = id;
                if(self.defaultRoom) {
                    self.enterRoom(self.defaultRoom);
                }
            });

            this.client.onSuccess(function() {
                $.ajax({
                    url: "http://"+ self.host + ":" + self.downport + "/room/" + self.room,
                    dataType: 'jsonp',
                    jsonp: 'callback',
                    async: false,
                    success: function(data) {
                        if(_.isArray(data)) {
                            self.addChat(data);
                        }
                        self.blink(true);
                    }
                });


                $.ajax({
                    url: "http://"+ self.host + ":" + self.downport + "/file/" + self.room,
                    dataType: 'jsonp',
                    jsonp: 'callback',
                    async: false,
                    success: function(data) {
                        if(_.isArray(data)) {
                            self.addFile(data);
                        }
                    }
                });


            });

            this.client.onNotice(function(text) {
                self.$messageList.append($('<li class="notice">').text(text));
            });

            this.client.onFilePath(function(size, filename, filePath) {
                var str = '<li class="file" data-file="' +filePath+ '" data-name="' + filename + '"><a href="http://'+ self.host + ":" + self.downport+'/download/'+filePath+'">"' + filename+ '" </a></li>';
                self.$messageList.append(str);

                //self.$messageList.append($('<li class="file" data-file="' +filePath+ '" data-name="' + filename + '">').text("<파일: " +filePath + "(" + size + "바이트)>"));
            });

            this.$form.submit(function() {
                event.preventDefault ? event.preventDefault() : event.returnValue =false;
                if(!self.started) {return;}
                var text = self.$input.val();
                self.$input.val('');
                self.client.sendChat(text);
                return false;
            });

            this.$room.find('li').click(function() {
                if(!self.started) {return;}
                var room = $(this).data('room');
                self.enterRoom(room, this);
            });

            this.$file.change(function(e) {
                if(!self.started) {return;}
                var file = e.target.files[0];
                var name = file.name;
                var stream = self.client._ss.createStream();
                self.upload(file, stream, {size: file.size, name: name})
            });


           /* this.$messageList.on('click', '.file', function() {
                var filePath = $(this).data('file');
                var fileName = $(this).data('name');
                var option = {};
                self.client.sendDownload(filePath, fileName, option);
            });*/

        },

        blink: function(option) {
            if(option) {
                this.$loading_div.fadeOut();
                this.$chat_div.fadeIn();
            } else {
                this.$loading_div.fadeIn();
                this.$chat_div.fadeOut();
            }
        },

        enterRoom: function(room, $li) {
            var self = this;
            if(room != this.room) {
                if($li) {
                    this.$room.find('li').removeClass('on');
                    $($li).addClass('on');
                }
                this.blink(false);
                this.remove();
                this.room = room;
                this.client.sendRoom(room);

            }
        },


        removeChat: function() {
            this.$messageList.empty();
        },

        removeFile: function() {
            this.$fileList.empty();
        },

        remove: function() {
            this.removeChat();
            this.removeFile();
        },

        upload: function(file, stream, option) {
            this.client.upload(file, stream, option);
        },

        addChat: function(data){
            for(var i = 0, length = data.length; i < length; ++i) {
                var name = data[i].name;
                var text = data[i].txt;
                if(this.userName == name) {
                    this.$messageList.append($('<li class="me">').text(name + ": " + text));
                } else {
                    this.$messageList.append($('<li>').text(name + ": " + text));
                }

            }
        },

        addFile: function(data) {
            for(var i = 0, length = data.length; i < length; ++i) {
                var fileName = data[i].filename;
                var filePath = this.room + "/" + fileName;
                var str = '<li><a href="http://'+ this.host + ":" + this.downport+'/download/'+filePath+'">"' + fileName+ '" </a></li>';
                this.$fileList.append(str);

            }
        }
    });



    return Chat;
});