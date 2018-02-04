const tourCountFromCommandCount = { 2: 1, 4: 3, 8: 4, 16: 5};
/*
TourModel = {
    newTour: function(name, minrang, commandCount) {

        if(!ConModel.isAdmin(this.connection.id)) {
            throw new Meteor.Error(9, 'Ошибка авторизации');
            return;
        }

        Com.remove({}); //Удаляем название команда
        Con.remove({online: false}); //Удаляем оффлайн
        _.each(Con.find().fetch(), function(i){

            if(i.online == false) {
                Con.remove({_id: i.id})
            } else {
                Con.update({_id: i._id}, {$set: {command: 0}}); //Все онлайн коннекшены в общий пулл
            }
        });

        Tour.remove({}); //Удаляем турнамент

        Env.update({name: 'status'}, { $set: {val: '0'} });

        if(name) {
            Env.update({name: 'name'}, {$set: {val: name}});
        }

        if(minrang) {
            Env.update({name: 'minrang'}, {$set: {val: minrang}});
        }

        commandCount = 8; //Колличестко комманд участников

        var tourCount = tourCountFromCommandCount[commandCount]; //Колличество туров в зависимости от участников

        var commandPull = []; //Пулл комманд

        for(var x = 1; x <= commandCount; x++) { //Заполняем пулл комманд
            Com.insert({num: x, name: 'Команда №'+x, list: []});
            commandPull.push(x);
        }

        commandPull = _.shuffle(commandPull); //Перемешиваем комманды у пулле
        var commandFromPull = 0; //Текущая комманда из пула, которая будет взята

        for(i = 1; i <= tourCount; i++) { //Создаем туры

            var matchCount = commandCount / Math.pow(2, i); //Высчитываем колличество матчей в туре

            for(j = 1; j <= matchCount; j++) { //Создаем по каждому матчу запись

                var currentTour = {
                    tour: i, //Номер тура
                    match: j, //Номер матча
                    commands: [], //Комманды в матче
                    status: 0 //Статус матча
                };

                if(i == 1) { //Если тур первый - раскидываем случайные 2 комманды из пула в матч
                    currentTour.commands.push(commandPull[commandFromPull], commandPull[commandFromPull + 1]);
                    commandFromPull += 2;
                } else { //Иначе заполняем командами "0"
                    //currentTour.commands = [0, 0];
                }

                Tour.insert(currentTour); //Создаем запись о матче
            }
        }
    },

    setWin: function(ds) {

        if(!ConModel.isAdmin(this.connection.id)) {
            throw new Meteor.Error(9, 'Ошибка авторизации');
            return;
        }

        var data = {};

        _.each(ds, function(i, k){
            data[k] = parseInt(i);
        });

        var flag = Tour.findOne({tour: data.tour, match: data.match, commands: data.win});

        if(!flag) {
            throw new Meteor.Error(4, 'Ошибка выбора победителя');
            return;
        }

        var countMatch = Tour.find({tour: data.tour}).count();
        var countNextMatch = countMatch / 2;

        var nextMatch =  Math.ceil( (data.match / countMatch) / (  1 /  countNextMatch  ) );

        var match = Tour.findOne({tour: data.tour + 1, match: nextMatch});

        if(countNextMatch >= 1) {

            if (!match) {
                throw new Meteor.Error(5, 'Ошибка выбора победителя');
                return;
            }

            if (match.commands.length >= 2) {
                throw new Meteor.Error(6, 'Ошибка выбора победителя');
                return;
            }

            Tour.update({_id: match._id}, { $push: { commands: data.win}});

        } else {
            Env.update({name: 'status'}, { $set: {val: String(data.win)} });

            var tmp = Con.find({command: {$gt: 0}}).fetch();

            Ban.remove({type: 'last_tour'});

            _.each(tmp, function(i){
                if(i.name  && i.vg_id && i.vg_level && i.command > 0) {
                    Ban.insert({name: i.name, vg_level: String(i.vg_level), vg_id: i.vg_id, type: 'last_tour'});
                } else {
                    console.log(i);
                }
            });
        }

        Tour.update({tour: data.tour, match: data.match}, { $set: {status: 1} });
    },

    renameCommand: function(num, name) {

        if(!ConModel.isAdmin(this.connection.id)) {
            throw new Meteor.Error(9, 'Ошибка авторизации');
            return;
        }

        Com.update({num: parseInt(num)}, { $set: {name: name} });
    }
};

Meteor.methods({
    'tour.newTour': TourModel.newTour,
    'tour.setWin': TourModel.setWin,
    'tour.renameCommand': TourModel.renameCommand
});
*/