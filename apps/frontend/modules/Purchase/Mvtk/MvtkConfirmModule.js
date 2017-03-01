"use strict";
/**
 * ムビチケ確認
 * @namespace Purchase.Mvtks.MvtkConfirmModule
 */
const MVTK = require("@motionpicture/mvtk-service");
const PurchaseSession = require("../../../models/Purchase/PurchaseModel");
/**
 * ムビチケ券適用確認ページ表示
 * @memberOf Purchase.Mvtk.MvtkConfirmModule
 * @function index
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {express.NextFunction} next
 * @returns {void}
 */
function index(req, res, next) {
    if (!req.session)
        return next(new Error(req.__('common.error.property')));
    const purchaseModel = new PurchaseSession.PurchaseModel(req.session.purchase);
    if (!purchaseModel.transactionMP)
        return next(new Error(req.__('common.error.property')));
    if (!purchaseModel.mvtk)
        return next(new Error(req.__('common.error.property')));
    console.log(purchaseModel.mvtk);
    //購入者情報入力表示
    res.locals.error = null;
    res.locals.step = PurchaseSession.PurchaseModel.TICKET_STATE;
    res.locals.transactionId = purchaseModel.transactionMP.id;
    res.locals.mvtk = purchaseModel.mvtk;
    res.locals.MVTK_TICKET_TYPE = MVTK.Constants.TICKET_TYPE;
    return res.render('purchase/mvtk/confirm');
}
exports.index = index;
/**
 * 券種選択へ
 * @memberOf Purchase.Mvtk.MvtkConfirmModule
 * @function submit
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {express.NextFunction} next
 * @returns {void}
 */
function submit(req, res, next) {
    if (!req.session)
        return next(new Error(req.__('common.error.property')));
    const purchaseModel = new PurchaseSession.PurchaseModel(req.session.purchase);
    if (!purchaseModel.transactionMP)
        return next(new Error(req.__('common.error.property')));
    //取引id確認
    if (req.body.transaction_id !== purchaseModel.transactionMP.id)
        return next(new Error(req.__('common.error.access')));
    return res.redirect('/purchase/ticket');
}
exports.submit = submit;
