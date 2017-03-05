var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');

var User = require('./models/user');
var Group = require('./models/group');

var app = express();
var port = process.env.PORT || 9999;
var router = express.Router();

mongoose.connect('mongodb://ken:123123@ds119020.mlab.com:19020/anna');
//mongoose.connect('mongodb://localhost:27017/rachel');

app.use(bodyParser.urlencoded({
  extended: true
}));

router.get('/', function(req,res){
    res.json({message: "Anna: how may I help?"});
});


//Helper//
Array.prototype.unique = function() {
    var a = this.concat();
    for(var i=0; i<a.length; ++i) {
        for(var j=i+1; j<a.length; ++j) {
            if(a[i] === a[j])
                a.splice(j--, 1);
        }
    }

    return a;
};

Array.prototype.remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};

function cleanArray(actual) {
  var newArray = new Array();
  for (var i = 0; i < actual.length; i++) {
    if (actual[i]) {
      newArray.push(actual[i]);
    }
  }
  return newArray;
}
//


// Master code //
router.post('/createUser', function(req,res){
    var user = new User();
    user.university = req.body.uni;
    user.facebookid = req.body.facebookid;
    user.name = req.body.name;

    user.save(function(err){
        if (err) res.send(err);
        res.json({"message": "user created"});
    });
});

//dev usage
router.get('/user', function(req,res){
    User.find({},function(err, doc){
        if (err) res.send(err);
        res.json(doc)
    });
});

//dev userId
router.get('/userid', function(req, res){

    console.log(req.query.facebookid);
    User.findOne({"facebookid": req.query.facebookid},function(err, doc){
        if (err) res.send(err);
        res.json({"uid": doc._id});
    });
});

router.get('/getGroupId', function(req, res){

    //console.log(req.query.name);
    Group.findOne({"name": req.query.name},function(err, doc){
        if (err) res.send(err);
        res.json({"gid": doc._id});
    });
});

router.post('/createGroup', function(req,res){
    var gp = new Group();
    gp.cat = req.body.cat;
    gp.description = req.body.des;
    //gp.duration = req.body.name;
    gp.capacity = req.body.cap;
    gp.name = req.body.name;

    User.findOne({"facebookid": req.body.owner},function(err, doc){
        if (err) res.send(err);
        gp.owner = mongoose.Types.ObjectId(doc._id);
        
        gp.save(function(err){
            if (err) res.send(err);
            doc.hostGroups.push(gp._id);
            User.findOneAndUpdate(doc._id, doc, function(err, ndoc){
                res.json({"message": "Group created"});
            });
        });
    });
});

router.get('/newgetGroups', function(req,res){
    var uni;
    var type;
    User.findOne({"facebookid": req.query.facebookid},function (err, doc) {
        if (err) res.send(err);
        uni = doc.university;
        console.log(doc)

        type = req.query.cat;
        if (type === 'all'){
            Group.find({})
            .populate('owner')
            .populate('joineduser')
            .exec(function (err, doc) {
            if (err) return handleError(err);
            var ret = [];
                for (var i =0; i < doc.length; i++){
                    if (doc[i].owner.university === uni && doc[i].joineduser.length <= doc[i].capacity){
                        ret.push(doc[i]);
                    }
                }
                res.json(ret);
            });
        }else{
            Group.find({})
            .populate('owner')
            .populate('joineduser')
            .exec(function (err, doc) {
            if (err) return handleError(err);
            var ret = [];
                for (var i =0; i < doc.length; i++){
                    if (doc[i].cat === type && doc[i].owner.university === uni && doc[i].joineduser.length <= doc[i].capacity){
                        ret.push(doc[i]);
                    }
                }
                res.json(ret);
            });
        }
    });

    

});

router.get('/getGroups', function(req,res){
    Group.find({},function(err, doc){
        if (err) res.send(err);
        res.json(doc)
    });
});

router.put('/joinGroup', function(req,res){
    var fid = req.body.facebookid;
    var uid;
    var gid = req.body.groupid;

    console.log(req.body);

    User.findOne({"facebookid": fid}, function(err, udoc){
        console.log(udoc);
        udoc.joinedGroups.push(gid);
        uid = udoc._id;
        User.findOneAndUpdate({"facebookid": fid}, udoc, function(err, fdoc){
            
        Group.findById(gid, function(err, doc){
            console.log(doc);
            if (err) res.send(err);
            var old = doc;

            old.joineduser.push(uid);
            Group.findByIdAndUpdate(gid, old, function(err, doc){
                res.json({"message": "group updated"})
            });
        });

        });
    });



});

router.put('/leaveGroup', function(req,res){
    var uid = req.body.userid;
    var gid = req.body.groupid;

    Group.findById(gid, function(err, doc){
        if (err) res.send(err);
        var old = doc;
        old.joineduser.remove(uid);
        Group.findByIdAndUpdate(gid, old, function(err, doc){
            
            User.findOne({"facebookid": fid}, function(err, udoc){
                udoc.joinedGroups.remove(gid);
                User.findOneAndUpdate({"facebookid": fid}, udoc, function(err, fdoc){
                    res.json({"message": "removed"});
                });
            });
        });
    });
});

router.delete('/deleteGroup', function(req,res){
    res.json({"message": "developing"});
});

router.get('/searchGroup', function(req, res){
    var gid = req.query.groupid;
    
    Group.findById(gid)
    .populate('owner')
    .populate('joineduser')
    .exec(function (err, doc) {
    if (err) return handleError(err);
        res.json(doc);
    });
});

router.get('/my_profile', function(req, res){
    var fid = req.query.facebookid;
    
    User.findOne({"facebookid": fid})
    .populate('hostGroups')
    .populate('joinedGroups')
    .exec(function (err, doc) {
    if (err) return handleError(err);
        res.json(doc);
    });
    
});

router.get('/getGroupInfo', function(req, res){
    res.json({"message": "developing"});    
});


app.use('/api', router);

app.listen(port);
console.log("Anna at port: " + port);