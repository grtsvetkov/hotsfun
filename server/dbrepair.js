Meteor.startup(function(){
    if (Meteor.users.find({'role': 'Admin'}).count() == 0) {

        //Создаем пользователя Администратор
        let _id = UserModel.create({
            username: 'Administrator',
            emails: [{
                address: 'admin@hotsfun.ru',
                verified: true
            }]
        });
        Meteor.users.update(_id, {$set: {'emails.0.verified': true, 'role': 'Admin'}});

        Accounts.setPassword(_id, 'LQkhMsHvAMWdN3xgp');
    }
});