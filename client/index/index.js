let userGoToPoolPromise = false;

let adminModalData = new ReactiveVar();

Tracker.autorun(function() {
    let user = Meteor.user();

    if(user) { //Изменилось что-то с пользователем

        if(userGoToPoolPromise) { //Мы пользователю обещали зайти в пул?
            userGoToPoolPromise = false;
            Meteor.call('user.goToPool');
        }

        if(!_.isEmpty(user.message)) { //Пришло сообщение пользователю
            if(new Date(user.message.expires) > new Date()) {
                sAlert[user.message.type](user.message.text);
            }

            Meteor.call('user.readMessage');
        }
    }

});

let drawTable = function () {

    let resultLine = {
        1: {start: '.game-1-1 .team:eq(1)', end: '.game-2-1 .team:eq(0)'},
        2: {start: '.game-1-2 .team:eq(1)', end: '.game-2-1 .team:eq(1)'},
        3: {start: '.game-1-3 .team:eq(1)', end: '.game-2-2 .team:eq(0)'},
        4: {start: '.game-1-4 .team:eq(1)', end: '.game-2-2 .team:eq(1)'},
        5: {start: '.game-2-1 .team:eq(1)', end: '.game-3-1 .team:eq(0)'},
        6: {start: '.game-2-2 .team:eq(1)', end: '.game-3-1 .team:eq(1)'}
    };

    _.each(resultLine, function (line, key) {

        let result =  $('.result-' + key);

        if(!result.length) {
            $('.tour').append('<div class="result result-'+key+'"><div class="result-top"></div><div class="result-bottom"></div></div>');
        }

        let end = $(line.end);

        if(!end.length) {
            return;
        }

        let start = $(line.start),
            startWidth = start.width(),
            startLeft = start.position().left,
            startTop = start.position().top + 2,

            endLeft = end.position().left,
            endTop = end.position().top + end.height() / 2,

            whoIsTop = startTop < endTop ? 'start' : 'end';

        $('.result-' + key).css({
            width: endLeft - startWidth - startLeft,
            left: startLeft + startWidth,
            top: whoIsTop == 'start' ? startTop : endTop,
            height: whoIsTop == 'start' ? endTop - startTop : startTop - endTop
        });

        if (whoIsTop == 'start') {
            $('.result-' + key).removeClass('revert');
        } else {
            $('.result-' + key).addClass('revert');
        }
    });


    $('.pool').css({'max-height': $('.tour').height()}); //calcTourHeight
};

Template.index.rendered = function () {
    drawTable();
    $(window).resize(drawTable);
};

Template.index.onDestroyed(function() {
    $(window).off('resize', drawTable);
});

Template.index.helpers({
    'inPool': function() {

        let user = Meteor.user();

        return user && user.pool;
    },
    
    'pool': function() {
        //return Meteor.users.find({role: 'Client', pool: -1}, {fields: {_id: 1, username: 1}}).fetch();
        return Meteor.users.find({pool: true}).fetch();
    },

    'command': function(num) {
        let command = Command.findOne({num: parseInt(num)});

        if(!command) {
            return;
        }

        command.online = true;


        let list = [];

        _.each(command.list, function(i) {
            let user = Meteor.users.findOne({_id: i});

            if(!user) {
                return;
            }

            if(!user.online) {
                command.online = false;
            }

            list.push({
                _id: user._id,
                username: user.username,
                online: user.online
            })
        });

        command.list = list;
        command.count = list.length;

        if(command.count < 5) {
            command.online = false;
        }

        Meteor.setTimeout(drawTable, 333);
        return command;
    },

    'tour_list': function() {

        let tour_list = [];

        _.each(Tour.find({}).fetch(), function(i){

            let tour_num = i.tour;

            if(!tour_list[tour_num - 1]) {
                tour_list.push({tour: tour_num, games: []})
            }

            tour_list[tour_num -1].games.push(i);

        });

        Meteor.setTimeout(drawTable, 333);
        return tour_list;
    },

    'winner': function() {
        let i = Variable.findOne({name: 'win'});
        
        if(!i || !i.data || !i.data.command) {
            return;
        }
        
        let list = [],
            data = Command.findOne({num: parseInt(i.data.command)});

        _.each(data.list, function(i) {
            let user = Meteor.users.findOne({_id: i});

            if(!user) {
                return;
            }

            list.push({
                _id: user._id,
                username: user.username,
                online: user.online
            })
        });
        
        return {
            name: data.name,
            list: list
        }
    }
});

Template.index.events({
    'click .team a': function (e) {
        e.preventDefault();

        $(e.currentTarget).closest('.team').find('.collapse').toggleClass('show');
        drawTable();
        return false;
    },

    'dblclick .team': function(e) {
        if(e.isDefaultPrevented()) {
            return;
        }

        adminModalData.set({
            type: 'command',
            tour: parseInt(e.currentTarget.dataset.tour),
            game: parseInt(e.currentTarget.dataset.game),
            command: Command.findOne({num: parseInt(e.currentTarget.dataset.num)})
        });

        $('#adminModal').modal('show');
    },

    'click #goToPool': function() {

        if(!Meteor.userId()) {
            userGoToPoolPromise = true;
            Meteor.loginWithBattlenet();
        } else {
            Meteor.call('user.goToPool');
        }
    },
    
    'click #outFromPool': function() {
        Meteor.call('user.outFromPool');
    }
});

Template.indexAdminModal.helpers({
    'data': function() {
        return adminModalData.get();
    }
});

Template.indexAdminModal.events({
    'click #userToCommandButton': function(e) { //Добавить в команду
        Meteor.call('tour.addUserToCommand', e.currentTarget.dataset.user_id, $('#userToCommandSelect').val(), function(err){
            if(err) {
                console.log(err);
                sAlert.error(err.reason);
            } else {
                $('#adminModal').modal('hide');
            }
        })
    },
    
    'click #userRemoveFromCommandButton': function(e) { //Исключить игрока из команды
        Meteor.call('tour.removeUserFromCommand', e.currentTarget.dataset.user_id, function(err){
            if(err) {
                console.log(err);
                sAlert.error(err.reason);
            } else {
                $('#adminModal').modal('hide');
            }
        })
    },

    'click #commandSetWin': function(e) { //Победитель встречи

        let data = adminModalData.get();

        data.win = e.currentTarget.dataset.num;

        Meteor.call('tour.setWin', data, function(err){
            if(err) {
                console.log(err);
                sAlert.error(err.reason);
            } else {
                $('#adminModal').modal('hide');
            }
        })
    },

    'click #commandAddRandom': function(e) { //Добавить случайного игрока
        Meteor.call('tour.addRandomUser', e.currentTarget.dataset.num, function(err){
            if(err) {
                console.log(err);
                sAlert.error(err.reason);
            } else {
                $('#adminModal').modal('hide');
            }
        })
    }
});

Template.indexBet.helpers({
    'bet': function() {
        let bet = Variable.findOne({name: 'bet'});

        if(!bet || !bet.data || [0, 1, 2].indexOf(bet.data.status) < 0) {
            return;
        }

        let list = {var1: [], var2: []};

        _.each(bet.data.list, function(item){

            let user = Meteor.users.findOne({_id: item.user_id});

            if(!user && !item.variant) {
                return;
            }

            list[item.variant == 1 ? 'var1': 'var2'].push({
                _id: user._id,
                username: user.username,
                online: user.online
            })
        });

        bet.list = list;

        let time = parseInt(bet.data.timer);

        var min = Math.floor(time / 60);
        var sec = time - min * 60;

        if (sec < 10) {
            sec = '0' + sec;
        }

        bet.time = min + ':' + sec;

        return bet;
    }
});

Template.indexBet.events({
    'click #adminBetStart': function() {
        Meteor.call('bet.start', function(err){
            if(err) {
                console.log(err);
                sAlert.error(err.reason);
            }
        });
    },

    'click #adminBetStop': function() {
        Meteor.call('bet.stop', function(err){
            if(err) {
                console.log(err);
                sAlert.error(err.reason);
            }
        });
    },

    'click #adminBetClose': function() {
        Meteor.call('bet.close', function(err){
            if(err) {
                console.log(err);
                sAlert.error(err.reason);
            }
        });
    }
});

Template.player.helpers({
    'isSelf': function() {
        return this._id == Meteor.userId();
    }
});

Template.player.events({
    'dblclick .player': function(e, tpl) {

        e.preventDefault();

        if(!isAdmin()) {
            return;
        }

        adminModalData.set({
            user: tpl.data,
            type: 'user',
            command: Command.findOne({list: tpl.data._id}),
            command_list: Command.find({}).fetch()
        });

        $('#adminModal').modal('show');
    }
});