var key = 'session';
var _  = require('underscore');

exports.addListeners = function (socket, sio){
	var socket = socket;
	var	sio = sio;
	socket.on(key + ':getCurrentUser', function (data, callback) {
        console.log('session:getCurrentUser');
		    callback(null, socket.handshake.session.user);
    });
};