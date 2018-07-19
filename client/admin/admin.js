Template.admin.events({
    'click #signin': function() {
        Meteor.loginWithPassword('admin@hotsfun.ru', $('#password').val(), function(err){
            if(err) {
                console.log(err);
                sAlert.error(err.reason);
            } else {
                Router.go('index');
            }
        })
    }
});