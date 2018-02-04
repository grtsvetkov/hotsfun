Meteor.startup(function(){
    if (Meteor.users.find({'role': 'Admin'}).count() == 0) {

        //Создаем пользователя Администратор
        let _id = UserModel.create({
            username: 'Administrator',
            emails: [{
                address: 'admin@hots.ru',
                verified: true
            }]
        });
        Meteor.users.update(_id, {$set: {'emails.0.verified': true, 'role': 'Admin'}});
    }
});