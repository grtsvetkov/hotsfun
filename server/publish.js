Meteor.publish('users', function () {
    return Meteor.users.find({role: 'Client'});
});