"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @namespace middlewares.SupertestRequest
 */
/**
 * supertestでセッション変更
 * @memberOf middlewares.SupertestRequest
 * @function supertestSession
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {express.NextFunction} next
 * @returns {void}
 */
// tslint:disable-next-line:variable-name
function supertestSession(req, _res, next) {
    if (!req.body.session)
        return next();
    const session = req.body.session;
    Object.keys(session).forEach((key) => {
        req.body.session[key] = session[key];
    });
}
exports.supertestSession = supertestSession;
