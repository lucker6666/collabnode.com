var util = require('../libs/util');
var config = require('../global').config;
var mongoose = require('mongoose')
var dateformat = require('dateformat');

var UserModel = mongoose.model('User');

exports.login = function (req, res) {
  console.log('login');
  if (req.method == "GET") {
    //只要访问了登录页，就清除cookie
    res.clearCookie(config.auth_cookie_name, {
      path: '/'
    });
    console.log(req.query['tip']);
    switch (req.query['tip']) {

      case 'error':
        var tip = "username or password error，please retry";
        break;
      default :
        var tip = null;
        break;
    }
    console.log('render login page');
    res.render('user/login', {tip: tip});
  } else if (req.method == "POST") {
    var reMail = /^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+((\.[a-zA-Z0-9_-]{2,3}){1,2})$/;
    var email = req.body.email;
    var password = util.md5(req.body.password);

    var query = null;

    if (reMail.test(email)) {
      //使用邮箱登录
      console.log(email);
      query = {'email': email, 'password': password}
    } else {
      console.log("not email");
      res.redirect('/user/login?tip=error');
      return;
    }

    // 向数据库查询用户
    UserModel.findOne(query, function (err, user) {
      if (!err) {
        if (user != null) {
          util.gen_session(user.email, user.password, res);
          res.redirect('/');
        } else {
          res.redirect('/user/login?tip=error')
        }
      } else {
        res.redirect('/user/login?tip=error')
      }
    })
  }
};

exports.register = function (req, res) {
  if (req.method == "GET") {
    switch (req.query['tip']) {
      case 'notemtpy':
        var tip = "不填写完整的孩子是坏孩子";
        break;
      // case 'exists_name':
      //   var tip = "该名号已经被使用了";
      //   break;
      case 'exists_email':
        var tip = "该邮箱地址已经被使用了";
        break;
      case 'failure':
        var tip = "注册失败，请重试";
        break;
      case 'format':
        var tip = "email格式错误";
        break;
      default :
        var tip = null;
        break;
    }
    res.render('user/register', {tip: tip});
  } else if (req.method == "POST") {
    var reMail = /^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+((\.[a-zA-Z0-9_-]{2,3}){1,2})$/;
    //获取用户的输入
    // var email = req.body.email;
    var email = req.body.email.toLowerCase();
    var password = req.body.password;
    var nickname = req.body.nickname;
    console.log(nickname);
    //验证用户空输入
    if (email == "" || password == "") {
      res.redirect('/user/register?tip=notemtpy');
      return;
    }
    console.log(email);
    if (!reMail.test(email)) {
      res.redirect('/user/register?tip=formaterr');
      return;
    }

    //该邮箱是否已经被使用
    UserModel.findOne({email: email}, function (err, result) {
      if (result == null) {
            // 密码进行MD5
          password = util.md5(password);
          var reg_time = util.getUTC8Time("YYYY-MM-DD HH:mm:ss");
          // 向数据库保存用户的数据，并进行 session 保存      /*添加管理权限字段 isAdmin canOperateShop*/
          user = new UserModel({
            'nickname':nickname,
            'email': email, 
            reg_time: reg_time, 
            'password': password, 
            'is_admin': email == config.admin_user_email, 
            'md5': util.md5(email)
          });
          user.save(function (err, user) {
            if (user != null) {
              util.gen_session(user.name, user.password, res);
              req.session.user = user;

              res.redirect('/?tip=welcome');
            } else {
              res.redirect('/user/register?tip=failure')
            }
          });
      } else {//邮箱已经被使用
        res.redirect('/user/register?tip=exists_email')
      }
    });
  }
};

exports.auth = function (req, res, next) {
  console.log('LIN::auth');
  if (req.session.user) {
    console.log("user auth next");
    return next();
  } else {
    var cookie = req.cookies[config.auth_cookie_name];
    if (!cookie) {
      return res.redirect(config.login_path);
    }
    var auth_token = util.decrypt(cookie, config.session_secret);
    var auth = auth_token.split('\t');
    var user_email = auth[0];

    UserModel.findOne({'email': user_email}, function (err, user) {
      if (!err && user) {
        if (user.email == config.admin_user_email)
          user.isAdmin = true
        req.session.user = user;
        return next();
      }
      else {
        return res.redirect(config.login_path);
      }
    });
  }
};

exports.logout = function (req, res) {
  console.log('LIN::logout');
  req.session.destroy();
  res.clearCookie(config.auth_cookie_name, {
    path: '/'
  });
  // return true;
  // res.redirect('/user/login');
  var tip = null;
  res.render('user/login', {tip: tip});
};