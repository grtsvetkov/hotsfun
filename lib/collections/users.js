import SimpleSchema from 'simpl-schema';

Schema.users = new SimpleSchema({

    username: {
        type: String,
        label: 'Никнэйм',
        optional: true
    },

    emails: {
        type: Array,
        label: 'E-mail адреса',
        optional: true
    },

    "emails.$": {
        type: Object
    },
    
    "emails.$.address": {
        type: String,
        label: 'E-mail',
        regEx: SimpleSchema.RegEx.Email
    },

    "emails.$.verified": {
        type: Boolean,
        label: 'проверенный'
    },
    
    message: {
        type: Object,
        label: 'Сообщение пользователю',
        optional: true,
        blackbox: true
    },

    createdAt: {
        label: 'Дата регистации',
        type: Date
    },

    image: {
        type: String,
        optional: true,
        label: 'Фотография'
    },

    role: {
        type: String,
        label: 'Права пользователя',
        defaultValue: 'Client'
    },

    pool: {
        type: Boolean,
        label: 'Пользователь в пуле',
        defaultValue: false
    },

    services: {
        type: Object,
        label: 'Аккаунты сервисов',
        optional: true,
        blackbox: true
    },
    
    online: {
        type: Boolean,
        label: 'is online',
        optional: true
    },

    connection: {
        type: String,
        label: 'Connection Id',
        optional: true
    }
});
Meteor.users.attachSchema(Schema.users);