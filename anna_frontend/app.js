var restify = require('restify');
var builder = require('botbuilder');
var request = require('request');

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function() {
    console.log('%s listening to %s', server.name, server.url);
});
//mongodb
var mongodburl = 'http://api-anna.azurewebsites.net/api'
    // Create chat bot
var connector = new builder.ChatConnector({
    appId: 'KEY',
    appPassword: 'KEY'
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

//luis
const LuisModelUrl = <ENCRYPTION>; 
var recognizer = new builder.LuisRecognizer(LuisModelUrl);
var intents = new builder.IntentDialog({ recognizers: [recognizer] });
bot.dialog('/', [
    function(session, args, next) {
        console.log(session.message.address.id);
        if (!session.userData.username) {
            session.beginDialog('/profile');
        } else {
            next();
        }
    },
    function(session, results) {
        session.send('Hello %s!', session.userData.username);
        session.beginDialog('/maindialog');
        console.log(session.message.address)
    }
]);
bot.beginDialogAction('test', '/test');
bot.dialog('/test', [
    function(session, args) {
        console.log(args);
        request.put({
            url: mongodburl + "/joinGroup",
            form: {
                "facebookid": session.userData.facebookid,
                "groupid": args.data
            }
        }, function(err, res, body) {
            //console.log(req.body);
            if (!err) {
                session.send('Joined ~~~');
                console.log("join successfully");
            } else {
                return console.error('Error on create_user: ', err);
            }
        });
        session.replaceDialog('/maindialog');
    }
]);
bot.dialog('/maindialog', intents);
bot.dialog('/profile', [
    function(session) {
        builder.Prompts.text(session, 'Hi! What is your name?');
    },
    function(session, results) {
        session.userData.username = results.response;
        session.userData.facebookid = session.message.address.id
        builder.Prompts.choice(session, "Where did you go to college?", ["CUHK", "HKU", "HKUST", "POLYU"])
    },
    function(session, results) {
        session.userData.university = results.response;
        console.log(result.response);
        request.post({
            url: mongodburl + "/createUser",
            form: {
                "facebookid": session.userData.facebookid,
                "name": session.userData.username,
                "uni": session.userData.university
            }
        }, function(err, res, body) {
            //console.log(req.body);
            if (!err) {
                console.log("create user successful");
            } else {
                return console.error('Error on create_user: ', err);
            }
        });

        session.endDialog();
    }
]);
//=========================================================
// Bots Dialogs
//=========================================================
intents.matches('report', function(session, args) {
        // Resolve and store entity passed from LUIS.
        // var message = JSON.stringify(session.message);
        // console.log("this is report");
        // console.log(message);
        // console.log('-------------------')
        // console.log(address);
        session.send('Hi this is report');
        session.replaceDialog('/profile');
        // if (country) {
        //     country = country.entity;
        //     request("https://restcountries.eu/rest/v1/name/" + country, function(error, response, body) {
        //         if (!error && response.statusCode == 200) {
        //             body = JSON.parse(body);
        //             var info = body[0];

        //             //In case of mulitple results, check for exact matching of country requested. If not found, then go with the first one
        //             for (var i = 0; i < body.length; ++i) {
        //                 if (body[i].name.toLowerCase() == country) {
        //                     info = body[i];
        //                     i = body.length;
        //                 }
        //             }

        //             if (info.capital) {
        //                 session.endDialog(info.name + "'s capital is " + info.capital + " :)");
        //             } else {
        //                 session.endDialog("Sorry, an error occurred. Please try again! :)");
        //             }
        //         } else {
        //             session.endDialog("Sorry, an error occurred. Please try again! :)");
        //         }
        //     });
        // } else {
        //     session.endDialog("Sorry, I don\'t think there is any country by that name.");
        // }
    })
    // getGroups    
    .matches('list', function(session, args) {
        // Resolve and store entity passed from LUIS.
        var country = builder.EntityRecognizer.findEntity(args.entities, 'builtin.geography.country');
        request(mongodburl + "/newgetGroups", function(error, response, body) {
            if (!error && response.statusCode == 200) {
                body = JSON.parse(body);
                console.log(body);

                function getCardsAttachments(body) {
                    var forreturn = [];
                    for (var i = 0; i < body.length; i++) {
                        forreturn.push(
                            new builder.HeroCard(session)
                            .title(body[i].name)
                            .subtitle('Offload the heavy lifting of data center management')
                            .text('Store and help protect your data. Get durable, highly available data storage across the globe and pay only for what you use.')
                            .images([
                                builder.CardImage.create(session, 'https://docs.microsoft.com/en-us/azure/storage/media/storage-introduction/storage-concepts.png')
                            ])
                            .buttons([
                                builder.CardAction.dialogAction(session, 'test', body[i]._id, 'Join Group')
                            ])
                        )
                    }
                    return forreturn;
                }
                var cards = getCardsAttachments(body);
                var reply = new builder.Message(session)
                    .attachmentLayout(builder.AttachmentLayout.carousel)
                    .attachments(cards);

                session.send(reply);
                session.replaceDialog('/maindialog');
            } else {
                session.send("Sorry, an error occurred. Please try again! :)");
                session.replaceDialog('/maindialog')
            }
        });

        // if (country) {
        //     country = country.entity;
        //     request("https://restcountries.eu/rest/v1/name/" + country, function(error, response, body) {
        //         if (!error && response.statusCode == 200) {
        //             body = JSON.parse(body);
        //             var info = body[0];

        //             //In case of mulitple results, check for exact matching of country requested. If not found, then go with the first one
        //             for (var i = 0; i < body.length; ++i) {
        //                 if (body[i].name.toLowerCase() == country) {
        //                     info = body[i];
        //                     i = body.length;
        //                 }
        //             }

        //             if (info.subregion) {
        //                 session.endDialog(info.name + " is in " + info.subregion + " :)");
        //             } else if (info.region) {
        //                 session.endDialog(info.name + " is in " + info.region + " :)");
        //             } else {
        //                 session.endDialog("Sorry, an error occurred. Please try again! :)");
        //             }
        //         } else {
        //             session.endDialog("Sorry, an error occurred. Please try again! :)");
        //         }
        //     });
        // } else {
        //     session.endDialog("Sorry, I don\'t think there is any country by that name.");
        // }
    })

.matches('creategroup', [
    function(session, args, next) {
        session.groupCreate.description = builder.EntityRecognizer.findEntity(args.entities, 'des');
        session.groupCreate.capacity = builder.EntityRecognizer.findEntity(args.entities, 'cap');
        builder.Prompts.choice(session, "Which catagory your group belong to?");
    },
    function(session, results, next) {
        // Resolve and store entity passed from LUIS.
        if (session.groupCreate.description) {
            if (!session.groupCreate.capacity) {
                session.groupCreate.capacity = 10;
            } else {
                session.groupCreate.capacity = session.groupCreate.capacity.entity;
            }
            session.groupCreate.description = session.groupCreate.description.entity;
            next({
                response: {
                    capacity: session.groupCreate.capacity,
                    description: session.groupCreate.description,
                    catagory: results.response
                }
            })
        } else {
            session.endDialog("Sorry, I don\'t think there is any event by that name.");
        }
    },
    function(session, results) {
        if (results.response) {
            request.post({
                url: mongodburl + "/createGroup",
                form: {
                    "owner": session.userData.facebookid,
                    "cap": results.response.capacity,
                    "des": results.response.description,
                    "catagory": results.response.catagory
                },
                function(err, res, body) {
                    //console.log(req.body);
                    if (!err) {
                        console.log("create user successful");
                    } else {
                        return console.error('Error on create_user: ', err);
                    }
                }
            });
        }
    }
])

.matches('None', function(session) {
    session.send('Sorry, I can not understand');
    session.replaceDialog('/maindialog');
});
