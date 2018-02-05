import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';

let topMenu = {
    index: 'Турнир',
    rules: 'Правила',
    about: 'О нас'
};

Template.AppLayout.helpers({
    
    'login': function() {

        let user = Meteor.user();

        if(user) {
            return user.username;
        } else {
            return false;
        }
    },
    
    'menu': function() {

        let current = Router.current().route.getName();
        
        return _.map(topMenu, function(name, key){
            return {
                name: name,
                key: key,
                isCurrent: key == current ? true : false
            }
        })
    }
});

testLogin = function() {
    Meteor.call('user.loginFromAdmin', 'gXNS4JbAxjKkx53kH', function (error, result) {
        if (!error) Meteor.loginWithToken(result.token, function () {
            Router.go('/');
        });
    });
};