Template.registerHelper('consoleLog', function (obj) {
    console.log(obj);
});

Template.registerHelper('eq', function (op1, op2) {
    return op1 == op2;
});