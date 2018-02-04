UserModel = {

    create: function (data) {

        if (!data.email && data.emails !== undefined && data.emails.length > 0) {
            data.email = data.emails[0].address;
        }

        if (!data.email && !data.username) {
            throw new Meteor.Error('500', 'Не указан Email или никнэйм');
        }

        if (data.services == undefined && !data.password) {
            data.password = '123';//
        }

        data.status = {online: false};

        data.role = 'Client';
        
        let user_id = Accounts.createUser(data);

        /*if (data.email) {
            MailModel.send('emailRegistration', data.email, 'Успешная регистрация', {
                name: data.email,
                login: data.email,
                password: data.password
            });
        }*/

        return user_id;
    }
};