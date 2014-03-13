(function (module) {

  "use strict";

  var mongoose = require('mongoose')
    , BoardSchema;

  BoardSchema = new mongoose.Schema({
    name: { 'type': String},
    owner: mongoose.Schema.ObjectId,
    created_time: { type: Date, default: Date.now },
    members: [{
      _id: mongoose.Schema.ObjectId,
    	nickname: String,
    	email: String,
    	is_admin: Boolean,
      md5: String,
      position: Number,
      cards: [{
        _id: mongoose.Schema.ObjectId,
        title: String,
        position: Number,
        owner: mongoose.Schema.ObjectId,
      }]
    }]
  });

  module.exports.schema = BoardSchema;
  module.exports = mongoose.model('Board', BoardSchema);

}(module));