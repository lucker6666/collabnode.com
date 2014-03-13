(function (module) {

  "use strict";
  var mongoose = require('mongoose')
    , CardSchema;
  var CommentSchema = require('./comment').schema;
  var UserSchema = require('./user').schema;
  
  CardSchema = new mongoose.Schema({
    title: String,
    description: String,
    done: { type: Boolean, 'default': false },
    created_time: {type: Date, 'default': Date.now},
    due: {type: Date, 'default': Date.now},
    createdby: mongoose.Schema.ObjectId,
    owner: {type: mongoose.Schema.ObjectId,ref:'User'},
    board: mongoose.Schema.ObjectId,
    comments:[{
      type: mongoose.Schema.ObjectId, ref:'Comment'
    }],
    attachments:[{
      name: String,
      link: String,
      attachedBy: {
        type: mongoose.Schema.ObjectId, ref:'User'
      }
    }],
    messages:[{
      type: mongoose.Schema.ObjectId, ref:'Message'
    }]
  });

  module.exports.schema = CardSchema;
  module.exports = mongoose.model('Card', CardSchema);

}(module));