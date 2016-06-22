/**
 * Created by hong on 2016-05-03.
 */

define(['jquery'], function($, Storage) {

    var App = Class.extend({
        init: function() {
            this.config = null;
            this.chat = null;
        },

        setChat: function(chat) {
            this.chat = chat;
        },

        start: function(userName) {
            var self = this;
            var config = this.config;
            this.chat.setServerOption(config.host, config.port, config.downport, userName);
            this.chat.run();
            if(userName && !this.chat.started) {

            }
        }



    });

    return App;
});