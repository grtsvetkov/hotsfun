import SimpleSchema from "simpl-schema";

Schema.command = new SimpleSchema({
    num: {
        type: Number,
        label: 'Номер команды'
    },
    name: {
        type: String,
        label: 'Название команды'
    },
    list: {
        type: Array,
        label: 'Список участников в команде',
        optional: true
    },
    'list.$': {
        type: String,
        label: 'Список участников в команде',
        optional: true
    }
});

Command = new Mongo.Collection('command', Schema.command);
Command.attachSchema(Schema.command);