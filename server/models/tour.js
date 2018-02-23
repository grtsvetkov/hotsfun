const tourCountFromCommandCount = {2: 1, 4: 3, 8: 4, 16: 5};

TourModel = {

    newTour: function (name, commandCount) {

        if (!Accounts.isAdmin()) {
            throw new Meteor.Error(10, ERROR[10]);
            return;
        }

        commandCount = commandCount ? parseInt(commandCount) : 8; //Колличестко комманд участников

        if (!tourCountFromCommandCount[commandCount]) {
            throw new Meteor.Error(21, ERROR[21]);
            return;
        }

        UserModel.moveAllToPool(); //Выгоняем всех в пулл
        Tour.remove({}); //Удаляем турнамент
        Command.remove({}); //Удаляем все команды

        let commandPull = []; //Пулл комманд

        for (let x = 1; x <= commandCount; x++) { //Заполняем пулл комманд
            Command.insert({num: x, name: 'Команда №' + x, list: []});
            commandPull.push(x);
        }

        commandPull = _.shuffle(commandPull); //Перемешиваем комманды у пулле

        let commandFromPull = 0; //Текущая комманда из пула (index), которая будет взята

        //Создаём туры. Колличество туров в зависимости от участников
        for (let i = 1; i <= tourCountFromCommandCount[commandCount]; i++) { //Создаем туры

            let gameCount = commandCount / Math.pow(2, i); //Высчитываем колличество матчей в туре

            for (let j = 1; j <= gameCount; j++) { //Создаем по каждому матчу запись

                let currentTour = {
                    tour: i, //Номер тура
                    game: j, //Номер матча
                    commands: [], //Комманды в матче
                    status: 0 //Статус матча
                };

                if (i == 1) { //Если тур первый - раскидываем случайные 2 комманды из пула в матч
                    currentTour.commands.push(commandPull[commandFromPull], commandPull[commandFromPull + 1]);
                    commandFromPull += 2;
                }

                Tour.insert(currentTour); //Создаем запись о матче
            }
        }
    },

    setWin: function (ds) {

        if (!Accounts.isAdmin()) {
            throw new Meteor.Error(10, ERROR[1]);
            return;
        }

        let data = {};

        _.each(ds, function (i, k) { //Работаем с Integer
            data[k] = parseInt(i);
        });

        if (!Tour.findOne({tour: data.tour, game: data.game, commands: data.win, status: 0})) {
            throw new Meteor.Error(22, ERROR[22]);
            return;
        }

        let countgame = Tour.find({tour: data.tour}).count(), //Колличество матчей в текущем туре
            countNextgame = countgame / 2, //колличество матчей в следующем туре
            nextgame = Math.ceil((data.game / countgame) / (  1 / countNextgame  )), //номер следующего матча
            game = Tour.findOne({tour: data.tour + 1, game: nextgame}); //Выбираем следующий матч

        if (countNextgame >= 1) {

            if (!game) {
                throw new Meteor.Error(23, ERROR[23]);
                return;
            }

            if (game.commands.length >= 2) {
                throw new Meteor.Error(24, ERROR[24]);
                return;
            }

            Tour.update({_id: game._id}, {$push: {commands: data.win}});

        } else { //Была последняя игра, финал. Определяем победителя турнира.

            //Была последняя игра, финал. Определяем победителя турнира.

        }

        Tour.update({tour: data.tour, game: data.game}, {$set: {status: 1}});
    },

    renameCommand: function (num, name) {

        if (!Accounts.isAdmin()) {
            throw new Meteor.Error(10, ERROR[10]);
            return;
        }

        Command.update({num: parseInt(num)}, {$set: {name: name}});
    },

    addUserToCommand: function (user_id, command_num) {
        if (!Accounts.isAdmin()) {
            throw new Meteor.Error(10, ERROR[10]);
            return;
        }

        command_num = parseInt(command_num);

        let command = Command.findOne({num: command_num});

        if (!command) {
            throw new Meteor.Error(25, ERROR[25]);
            return;
        }

        if (command.list.length >= 4) {
            throw new Meteor.Error(26, ERROR[26]);
            return;
        }

        if (Command.findOne({list: user_id})) {
            throw new Meteor.Error(27, ERROR[27]);
            return;
        }

        Command.update({_id: command._id}, {$push: {list: user_id}});

        Meteor.users.update({_id: user_id}, {$set: {pool: false}});
    },

    addRandomUser: function(command_num) {
        if (!Accounts.isAdmin()) {
            throw new Meteor.Error(10, ERROR[10]);
            return;
        }

        command_num = parseInt(command_num);

        let command = Command.findOne({num: command_num});

        if (!command) {
            throw new Meteor.Error(25, ERROR[25]);
            return;
        }

        if (command.list.length >= 4) {
            throw new Meteor.Error(26, ERROR[26]);
            return;
        }

        let alreadyInCommand = [];

        _.each(Command.find({}).fetch(), function(i){
            alreadyInCommand = _.union(alreadyInCommand, i.list);
        });

        var list = Meteor.users.find({online: true, pool: true,  _id: { $nin: alreadyInCommand }}).fetch();

        if (!list || list.length == 0) {
            throw new Meteor.Error(29, ERROR[29]);
            return;
        }

        list = _.shuffle(list);

        var user = list[_.random(0, list.length - 1)];

        Command.update({_id: command._id}, {$push: {list: user._id}});

        Meteor.users.update({_id: user._id}, {$set: {pool: false}});
    },

    removeUserFromCommand: function(user_id) {
        if (!Accounts.isAdmin()) {
            throw new Meteor.Error(10, ERROR[10]);
            return;
        }

        let command = Command.findOne({list: user_id});

        if(!command) {
            throw new Meteor.Error(28, ERROR[28]);
            return;
        }

        Command.update({_id: command._id}, {$pull: {list: user_id}});

        Meteor.users.update({_id: user_id}, {$set: {pool: true}});
    }
};

Meteor.methods({
    'tour.newTour': TourModel.newTour,
    'tour.setWin': TourModel.setWin,
    'tour.renameCommand': TourModel.renameCommand,
    'tour.addUserToCommand': TourModel.addUserToCommand,
    'tour.addRandomUser': TourModel.addRandomUser,
    'tour.removeUserFromCommand': TourModel.removeUserFromCommand

});
