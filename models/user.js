(function (module) {

  "use strict";

  var mongoose = require('mongoose')
    , UserSchema;

  UserSchema = new mongoose.Schema({
    nickname: { 'type': String, 'default': 'empty todo...' },
    email: { 'type': String},
    password: { 'type': String},
    reg_time: { 'type': String, 'default': false},
    is_admin: { 'type': Boolean, "default": false},
    md5: String,
    boards:[{
      _id: mongoose.Schema.ObjectId,
      name: String
    }]
  });

  module.exports.schema = UserSchema;
  module.exports = mongoose.model('User', UserSchema);

}(module));