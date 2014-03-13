exports.config = {
  session_secret: process.env.SESSION_SECRET || 'SESSION_SECRET',
  cookie_secret: process.env.COOKIE_SECRET || 'COOKIE_SECRET',
  auth_cookie_name: process.env.AUTH_COOKIE_NAME || 'collab_secret',
  login_path: '/user/login',//用户登录地址
  time_zone: 8,//时区，不般不用改
  admin_user_email: process.env.ADMIN_USER_EMAIL || 'admin@admin.com',//默认超级管理员的邮箱地址
  nodeMailer: {
    service: "Gmail",
    from: "admin@gmail.com",
    auth: {
      user: "linyaoyi011@gmail.com",
      pass: "34731902lyy"
    }
  }

  
};

//运行时的临时变量
exports.runtime = {};
