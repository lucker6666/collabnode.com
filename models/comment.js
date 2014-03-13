(function (module) {

  "use strict";

  var mongoose = require('mongoose')
    , CommentSchema;

  CommentSchema = new mongoose.Schema({
    content: String,
    created_time: { type: Date, default: Date.now },
    board: mongoose.Schema.ObjectId,
    card: mongoose.Schema.ObjectId,
    author: { 
      '_id': mongoose.Schema.ObjectId,
      'nickname':String,
      'email': String,
      'md5': String,
    },
    at: [{ 
      '_id': mongoose.Schema.ObjectId,
      'nickname':String,
      'email': String,
      'md5': String,
    }],
    replies:[{
      type: mongoose.Schema.ObjectId, ref: 'Comment'
    }],
  });

  module.exports.schema = CommentSchema;
  module.exports = mongoose.model('Comment', CommentSchema);

}(module));