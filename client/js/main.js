/**
 * Created by hong on 2016-05-03.
 */
require.config({
    paths: {
        socketio: 'https://cdn.socket.io/socket.io-1.4.5',
        socketiostream: './lib/socket.io-stream',
        jquery: 'https://code.jquery.com/jquery-1.12.3.min'
    }
});
define(['jquery', 'app'], function($, App) {

    var app;

    var initApp = function() {
        $(document).ready(function() {
            app = new App();

            initChat(app);
        });
    };

    var initChat = function(app) {
        require(['chat'], function(Chat) {

            var chat = new Chat(app);
            app.setChat(chat);

            app.start();



        });
    };

    initApp();
});