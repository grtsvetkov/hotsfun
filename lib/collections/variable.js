import SimpleSchema from "simpl-schema";

Schema.variable = new SimpleSchema({
    name: {
        type: String,
        label: 'Название'
    },
    data: {
        type: Object,
        label: 'Данные',
        optional: true,
        blackbox: true
    }
});

Variable = new Mongo.Collection('variable', Schema.variable);
Variable.attachSchema(Schema.variable);