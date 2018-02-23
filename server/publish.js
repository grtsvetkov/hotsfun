Meteor.publish('users', function () {
    return Meteor.users.find({}, {fields: { emails: 0, createdAt: 0, services: 0, connection: 0 }});
});

Meteor.publish('tour', function () {
    return Tour.find({});
});

Meteor.publish('command', function () {
    return Command.find({});
});