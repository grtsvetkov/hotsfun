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
                isCurrent: key == current
            }
        });
    }
});

Template.AppLayout.events({
    'click #newTour': function() {
        if(!isAdmin()) {
            return;
        }

        Meteor.call('tour.newTour', function(err){
            if(err) {
                console.log(err);
                sAlert.error(err.reason);
            }
        })
    },

    'click #newBet': function() {
        if(!isAdmin()) {
            return;
        }

        $('#betModal').modal('show');
    }
});

Template.betModal.events({
    'click .btn-primary': function() {
        if(!isAdmin()) {
            return;
        }
        
        let type = $('#betModal-betType').val(),
            timer = parseInt($('#betModal-betTimer').val());

        Meteor.call('bet.newBet', type, timer, function(err){
            if(err) {
                console.log(err);
                sAlert.error(err.reason);
            } else {
                $('#betModal').modal('hide');
            }
        })
    }
});