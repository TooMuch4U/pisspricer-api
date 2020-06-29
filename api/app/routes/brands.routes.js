const brands = require('../controllers/brands.controller');
const authenticate = require('../middleware/authenticate');

module.exports = function(app) {
    const baseUrl = app.rootUrl + '/brands';

    app.route(baseUrl + '/')
        .get(brands.getAll)
        .post(authenticate.adminRequired, brands.insert);

};