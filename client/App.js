import 'bootstrap/dist/css/bootstrap.css';

let topMenu = {
    index: 'Турнир',
    rules: 'Правила',
    about: 'О нас'
};

Template.AppLayout.helpers({
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