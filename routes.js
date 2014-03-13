var main = require('./routes/main');
var user = require('./routes/user');
var board = require('./routes/board');
var notification = require('./routes/notification');
var search = require('./api/search');

module.exports = function(app){
	app.get('/', user.auth, main.index);
	//user
  	app.get('/user/login', user.login);
  	app.post('/user/login', user.login);
  	app.get('/user/logout', user.logout);
    app.post('/user/logout', user.logout);
  	app.get('/user/register', user.register);
  	app.post('/user/register', user.register);


    //board
    app.get('/board/:id', board.index);
    //notification
    app.get('/notification', notification.index);

  	//search
    app.get('/api/search/members', search.members)
  	app.get('/api/search/users', search.users)

  	//template
  	app.get('/partials/:name', main.partials);
};