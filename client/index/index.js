let userGoToPoolPromise = false;

Tracker.autorun(function() {
    let user = Meteor.user();

    if(user) {

        if(userGoToPoolPromise) {
            userGoToPoolPromise = false;
            Meteor.call('user.goToPool');
        }

        console.log('User is changed');
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

        let start = $(line.start),
            startWidth = start.width(),
            startLeft = start.position().left,
            startTop = start.position().top + 2,

            end = $(line.end),
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
};

Template.index.helpers({
    
    'inPool': function() {
        return Meteor.user() && Meteor.user().pool;
    },
    
    'pool': function() {
        return Meteor.users.find({role: 'Client', pool: -1}, {fields: {_id: 1, username: 1}}).fetch();
    }
});

Template.index.events({
    'click .team': function (e) {
        e.preventDefault();

        $(e.currentTarget).closest('.team').find('.collapse').toggleClass('show');
        drawTable();
        return false;
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

Template.player.helpers({
    'isSelf': function() {
        return this._id == Meteor.userId();
    }
});