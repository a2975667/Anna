var mongoose = require('mongoose');
var User = require('./user');

var GroupSchema = new mongoose.Schema({
    name: String,
    cat:String,
    description: String,
    owner: {type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    joineduser: [{type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    capacity: Number,
    duration: Date
});

module.exports = mongoose.model('Group', GroupSchema);