/**
 * Created by hong on 2016-05-03.
 */
var cls = require("./lib/class");
var _ = require("underscore");
var Types = require('./types');
var message = require('./message');


module.exports = HongServer = cls.Class.extend({
    init: function(chatServer) {
        log.info("채팅 유저관리 서버를 시작합니다.");
        this.server = chatServer;

        this.users = {};
        this.usersCount = 0;

        this.queues = {};

        this.enter_callback = null;



        this.onUserEnter(function(user) {
            log.info(user.name + "님이 로그인하셨습니다.");
        });

    },

    onUserEnter: function(callback) {
        this.enter_callback = callback;
    },

    addUser: function(user) {
        console.log(user.id);
        this.users[user.id] = user;
        this.queues[user.id] = [];
    }
});