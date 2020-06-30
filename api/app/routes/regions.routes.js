const regions = require('../controllers/regions.controller');
const authenticate = require('../middleware/authenticate');

module.exports = function(app) {
    const baseUrl = app.rootUrl + '/regions';

    app.route(baseUrl + '/')
        .post(authenticate.adminRequired, regions.create)

};