const stores = require('../controllers/stores.controller');
const authenticate = require('../middleware/authenticate');

module.exports = function(app) {
    const baseUrl = app.rootUrl;

    app.route(baseUrl + '/')
        .post(users.create);



};