const items = require('../controllers/items.controller');
const authenticate = require('../middleware/authenticate');

module.exports = function(app) {
    const baseUrl = app.rootUrl + '/items';

    app.route(baseUrl + '/')
        .get(authenticate.setAuthenticatedUser, items.getAll)
        .post(authenticate.adminRequired, items.create);
};