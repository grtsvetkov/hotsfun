let calcTourHeight = function() {
    $('.pool').css({'max-height': $('.tour').height()})
};

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
};

Template.index.rendered = function () {
    drawTable();
    calcTourHeight();
};

Template.index.events({
    'click .team': function (e) {
        e.preventDefault();

        $(e.currentTarget).closest('.team').find('.collapse').toggleClass('show');
        drawTable();
        calcTourHeight();
        return false;
    }
});