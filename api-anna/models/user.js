var mongoose = require('mongoose');
var Group = require('./group');

var UserSchema = new mongoose.Schema({
    facebookid: String,
    name: String,
    number: String,
    university: String,
    //hostGroups: [String],
    //joinedGroups: [String]
    hostGroups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
    joinedGroups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }]
});

module.exports = mongoose.model('User', UserSchema);