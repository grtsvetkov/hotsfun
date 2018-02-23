isAdmin = function() {
    let user = Meteor.user();

    return user && user.role == 'Admin';
};