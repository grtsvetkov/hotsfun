/**
 * Статусы:
 * 0 - ставки созданы, не запущены (начало)
 * 1 - ставки запущены
 * 2 - ставки остановлены
 *
 */

BetModel = {

    timerHandler: null,

    newBet: function(type, timer) {
        if (!Accounts.isAdmin()) {
            throw new Meteor.Error(10, ERROR[10]);
            return;
        }
        
        Variable.remove({name: 'bet'});

        if(BetModel.timerHandler) {
            Meteor.clearTimeout(BetModel.timerHandler);
        }

        timer = parseInt(timer) > 0 ? parseInt(timer) : 120;
        type = type ? type : 1;

        Variable.insert({
            name: 'bet',
            data: {
                timer: timer,
                type: type,
                status: 0,
                list: []
            }
        });
    },

    start: function() {

        if (!Accounts.isAdmin()) {
            throw new Meteor.Error(10, ERROR[10]);
            return;
        }

        let bet = Variable.findOne({name: 'bet'});

        if(bet && bet.data && bet.data.status == 0) {
            Variable.update({_id: bet._id}, { $set: { 'data.status': 1 } });

            BetModel.timerHandler = Meteor.setTimeout(BetModel._timerFunc, 1000);

        } else {
            throw new Meteor.Error(51, ERROR[51]);
            return;
        }
    },

    stop: function() {
        if (!Accounts.isAdmin()) {
            throw new Meteor.Error(10, ERROR[10]);
            return;
        }

        let bet = Variable.findOne({name: 'bet'});

        if(bet && bet.data && bet.data.status == 1) {

            Variable.update({_id: bet._id}, { $set: { 'data.status': 2 } });

            if(BetModel.timerHandler) {
                Meteor.clearTimeout(BetModel.timerHandler);
            }

        } else {
            throw new Meteor.Error(52, ERROR[52]);
            return;
        }
    },


    close: function() {
        if (!Accounts.isAdmin()) {
            throw new Meteor.Error(10, ERROR[10]);
            return;
        }

        Variable.remove({name: 'bet'});
    },

    _timerFunc: function() {
        let bet = Variable.findOne({name: 'bet'});

        if(bet && bet.data && bet.data.status == 1) {

            let newTime = bet.data.timer - 1;

            Variable.update({_id: bet._id}, { $set: {'data.timer': newTime}});

            if(newTime == 0) {

                Meteor.unSaveRightCall = true;
                BetModel.stop();

            } else {

                BetModel.timerHandler = Meteor.setTimeout(BetModel._timerFunc, 1000);

            }
        }
    },

    makeBet: function(variant) {
        let user_id = Meteor.userId();

        if(!user_id) {
            throw new Meteor.Error(53, ERROR[53]);
            return;
        }

        variant = parseInt(variant);

        if(!variant) {
            throw new Meteor.Error(54, ERROR[54]);
            return;
        }

        let bet = Variable.findOne({name: 'bet'});

        if(bet && bet.data && bet.data.status == 1) {

            let alreadyFlag = false;

            _.each(bet.data.list, function(item) {
                if(item.user_id == user_id) {
                    alreadyFlag = true;
                }
            });

            if(alreadyFlag) {
                throw new Meteor.Error(55, ERROR[55]);
                return;
            }


            bet.data.list.push({user_id: user_id, variant: variant});

            Variable.update({_id: bet._id}, {$set: { 'data.list': bet.data.list }});

            return true;

        } else {
            throw new Meteor.Error(56, ERROR[56]);
            return;
        }
    }
};

Meteor.methods({
    'bet.newBet': BetModel.newBet,
    'bet.start': BetModel.start,
    'bet.stop': BetModel.stop,
    'bet.close': BetModel.close,
    'bet.makeBet': BetModel.makeBet
});