Template.registerHelper('consoleLog', function (obj) {
    console.log(obj);
});

Template.registerHelper('isAdmin', function () {
    return isAdmin();
});

Template.registerHelper('eq', function (op1, op2) {
    return op1 == op2;
});