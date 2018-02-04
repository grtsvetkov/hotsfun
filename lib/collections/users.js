import SimpleSchema from 'simpl-schema';

Schema.users = new SimpleSchema({

    username: {
        type: String,
        label: 'Никнэйм',
        regEx: /^[a-z0-9A-Z_]{3,15}$/,
        optional: true
    },
    'emails': {
        type: Array,
        label: 'E-mail адреса',
        optional: true
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
    services: {
        type: Object,
        label: 'Аккаунты соц. сетей',
        optional: true,
        blackbox: true
    },
    online: {
        type: Boolean,
        label: 'is online',
        optional: true
    }
});
Meteor.users.attachSchema(Schema.users);