const users = require('../controllers/users.controller');
const authenticate = require('../middleware/authenticate');

module.exports = function(app) {
    const baseUrl = app.rootUrl + '/users';

    app.route(baseUrl + '/register')
        .post(users.create);

};
