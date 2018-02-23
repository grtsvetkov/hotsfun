var moment = require('moment');

UserModel = {

     /**
     * Регистрация пользователя
     * @param {Object} data данные регистрации пользователя 
     * @returns {String} user_id
     */
    create: function (data) {

        if (!data.username) {
            throw new Meteor.Error(11, ERROR[11]);
        }

        data.online = true;

        data.role = 'Client';

        data.pool = false;

        return Accounts.createUser(data);
    },

    /**
     * Ввывести всех пользователей в пул
     */
    moveAllToPool: function() {

        if(!Accounts.isAdmin()) {
            throw new Meteor.Error(10, ERROR[1]);
            return;
        }
        
        _.each(Meteor.users.find({}).fetch(), function(i){

            let flag = Command.findOne({list: i._id}); //Пользователь был в какой-то команде
            
            if(flag && i.online) { //Из команды попадает в пул
                UserModel.sendMsgToUser(i._id, 'success', 'Вы были направлены в общий пул участников', 3);
            }

            Meteor.users.update({_id: i._id}, {$set: {pool: (flag && i.online) || (i.pool && i.online) ? true : false}});
        })
    },

    /**
     * Зайти пользователь в пул
     */
    goToPool: function() {
        Meteor.users.update({_id: Meteor.userId()}, {$set: {pool: true}});
    },

    /**
     * Выйти пользователем из пула
     */
    outFromPool: function() {
        Meteor.users.update({_id: Meteor.userId()}, {$set: {pool: false}});
    },

    /**
     * Отправить сообщение пользователю
     * @param {String} user_id Уникальный идентификатор пользователя
     * @param {String} text Текст сообщения
     * @param {Integer} expires Истекает через (integer в минутах)
     */
    sendMsgToUser: function(user_id, type, text, expires) {

        if(!Accounts.isAdmin()) {
            throw new Meteor.Error(10, ERROR[10]);
            return;
        }

        Meteor.users.update({_id: user_id}, {$set: {message: {type: type, text: text, expires: moment().add(expires, 'm').toDate()}}});
    },

    readMessage: function() {
        Meteor.users.update({_id: Meteor.userId()}, {$set: {message: {}}});
    }
};

Meteor.methods({

    'user.goToPool': UserModel.goToPool,
    
    'user.moveAllToPool': UserModel.moveAllToPool,
    
    'user.outFromPool': UserModel.outFromPool,

    'user.sendMsgToUser': UserModel.sendMsgToUser,
    'user.readMessage': UserModel.readMessage
});