(function (module) {

  "use strict";

  var mongoose = require('mongoose')
    , MessageSchema;

  MessageSchema = new mongoose.Schema({
    from: {type: mongoose.Schema.ObjectId, ref: 'User'},
    to: {type: mongoose.Schema.ObjectId, ref: 'User'},
    flag: {type: Boolean, default:false},
    created_time: { type: Date, default: Date.now },
    content: String,
    card: {
      _id:mongoose.Schema.ObjectId,
      title: String,
      owner:mongoose.Schema.ObjectId,
    },
    board: {
      _id:mongoose.Schema.ObjectId,
      name: String,
      owner: mongoose.Schema.ObjectId,
    },
    type: Number,
  });

  module.exports.schema = MessageSchema;
  module.exports = mongoose.model('Message', MessageSchema);

}(module));