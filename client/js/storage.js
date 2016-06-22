/**
 * Created by hong on 2016-05-06.
 */
define(function() {
    var Storage = Class.extend({
        init: function() {
            this. data = null;

            if(this.hasLocalStorage() && localStorage.data) {
                this.data = JSON.parse(localStorage.data);
            } else if(this.hasLocalStorage()){
                this.resetData();
            }
        },

        resetData: function() {
            this.data = {
                room: []
            }
        },

        hasLocalStorage: function() {
            return Modernizr.localstorage;
        },

        save: function() {
            if(this.hasLocalStorage()) {
                localStorage.data = JSON.stringify(this.data);
            }
        },

        clear: function() {
            if(this.hasLocalStorage()) {
                localStorage.data = JSON.stringify(this.data);
            }
        },


        initChat: function() {
            this.data.hasAlreadyChat = true;
            this.save();
        },

        getRoom: function(room) {
            return this.data.room[room];
        },

        setRoom: function(room) {
            this.data.room[room] = [];
            this.save();
        },

        setChat: function(room, name, text) {
            if(!this.data.room[room]) {
                this.data.room[room] = [];
            }
            this.data.room[room].push([name, text]);
            this.save();
        }
    });

    return Storage;

});