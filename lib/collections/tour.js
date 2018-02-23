import SimpleSchema from "simpl-schema";

Schema.tour = new SimpleSchema({
    tour: {
        type: Number,
        label: 'Номер тура (этапа)'
    },
    game: {
        type: Number,
        label: 'Номер матча в туре (этапе)'
    },
    commands: {
        type: Array,
        label: 'Команды в матче',
        optional: true
    },
    'commands.$': {
        type: Number,
        label: 'Команда в матче',
        optional: true
    },
    status: {
        type: Number,
        label: 'Статус матча'
    }
});

Tour = new Mongo.Collection('tour', Schema.tour);
Tour.attachSchema(Schema.tour);