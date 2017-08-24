"use strict";
/**
 * 購入座席選択
 * @namespace Purchase.SeatModule
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const COA = require("@motionpicture/coa-service");
const ssktsApi = require("@motionpicture/sskts-api");
const debug = require("debug");
const fs = require("fs-extra");
const seatForm = require("../../forms/Purchase/SeatForm");
const AuthModel_1 = require("../../models/Auth/AuthModel");
const PurchaseModel_1 = require("../../models/Purchase/PurchaseModel");
const ErrorUtilModule = require("../Util/ErrorUtilModule");
const UtilModule = require("../Util/UtilModule");
const log = debug('SSKTS:Purchase.SeatModule');
/**
 * 座席選択
 * @memberof Purchase.SeatModule
 * @function index
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns {Promise<void>}
 */
function index(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (req.session === undefined)
                throw ErrorUtilModule.ERROR_PROPERTY;
            if (req.session.purchase === undefined)
                throw ErrorUtilModule.ERROR_EXPIRE;
            const purchaseModel = new PurchaseModel_1.PurchaseModel(req.session.purchase);
            if (purchaseModel.isExpired())
                throw ErrorUtilModule.ERROR_EXPIRE;
            if (!purchaseModel.accessAuth(PurchaseModel_1.PurchaseModel.SEAT_STATE)) {
                throw ErrorUtilModule.ERROR_ACCESS;
            }
            if (req.params.id === undefined)
                throw ErrorUtilModule.ERROR_ACCESS;
            res.locals.reserveSeats = (purchaseModel.seatReservationAuthorization !== null)
                ? JSON.stringify(purchaseModel.seatReservationAuthorization) //仮予約中
                : null;
            res.locals.error = null;
            res.locals.purchaseModel = purchaseModel;
            res.locals.step = PurchaseModel_1.PurchaseModel.SEAT_STATE;
            //セッション更新
            purchaseModel.save(req.session);
            res.render('purchase/seat', { layout: 'layouts/purchase/layout' });
        }
        catch (err) {
            const error = (err instanceof Error)
                ? new ErrorUtilModule.CustomError(ErrorUtilModule.ERROR_EXTERNAL_MODULE, err.message)
                : new ErrorUtilModule.CustomError(err, undefined);
            next(error);
        }
    });
}
exports.index = index;
/**
 * パフォーマンス変更
 * @memberof Purchase.SeatModule
 * @function performanceChange
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
function performanceChange(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (req.session === undefined)
                throw ErrorUtilModule.ERROR_PROPERTY;
            if (req.session.purchase === undefined)
                throw ErrorUtilModule.ERROR_EXPIRE;
            const purchaseModel = new PurchaseSession.PurchaseModel(req.session.purchase);
            if (purchaseModel.isExpired())
                throw ErrorUtilModule.ERROR_EXPIRE;
            // tslint:disable-next-line:no-console
            console.log(req.body.performanceId);
            purchaseModel.performance = yield MP.getPerformance(req.body.performanceId);
            log('パフォーマンス取得');
            purchaseModel.performanceCOA = yield MP.getPerformanceCOA(purchaseModel.performance.attributes.theater.id, purchaseModel.performance.attributes.screen.id, purchaseModel.performance.attributes.film.id);
            log('COAパフォーマンス取得');
            //セッション更新
            req.session.purchase = purchaseModel.toSession();
            res.json({
                err: null,
                result: {
                    performance: purchaseModel.performance,
                    performanceCOA: purchaseModel.performanceCOA
                }
            });
        }
        catch (err) {
            const error = (err instanceof Error)
                ? new ErrorUtilModule.CustomError(ErrorUtilModule.ERROR_EXTERNAL_MODULE, err.message)
                : new ErrorUtilModule.CustomError(err, undefined);
            res.json({
                err: error.message,
                result: null
            });
        }
    });
}
exports.performanceChange = performanceChange;
/**
 * 座席決定
 * @memberof Purchase.SeatModule
 * @function select
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns {Promise<void>}
 */
// tslint:disable-next-line:max-func-body-length
function select(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (req.session === undefined)
                throw ErrorUtilModule.ERROR_PROPERTY;
            if (req.session.purchase === undefined)
                throw ErrorUtilModule.ERROR_EXPIRE;
            const purchaseModel = new PurchaseModel_1.PurchaseModel(req.session.purchase);
            if (purchaseModel.transaction === null)
                throw ErrorUtilModule.ERROR_PROPERTY;
            if (purchaseModel.isExpired())
                throw ErrorUtilModule.ERROR_EXPIRE;
            if (req.params.id === undefined)
                throw ErrorUtilModule.ERROR_ACCESS;
            //取引id確認
            if (req.body.transactionId !== purchaseModel.transaction.id)
                throw ErrorUtilModule.ERROR_ACCESS;
            //バリデーション
            seatForm.seatSelect(req);
            const validationResult = yield req.getValidationResult();
            if (!validationResult.isEmpty()) {
                res.locals.reserveSeats = req.body.seats;
                res.locals.error = validationResult.mapped();
                res.locals.purchaseModel = purchaseModel;
                res.locals.step = PurchaseModel_1.PurchaseModel.SEAT_STATE;
                res.render('purchase/seat', { layout: 'layouts/purchase/layout' });
                return;
            }
<<<<<<< HEAD
            const selectSeats = JSON.parse(req.body.seats).listTmpReserve;
            yield reserve(req, selectSeats, purchaseModel);
=======
            const selectSeats = JSON.parse(req.body.seats).list_tmp_reserve;
            if (purchaseModel.performance === null)
                throw ErrorUtilModule.ERROR_PROPERTY;
            if (purchaseModel.performanceCOA === null)
                throw ErrorUtilModule.ERROR_PROPERTY;
            const performance = (process.env.VIEW_TYPE === 'fixed')
                ? yield MP.getPerformance(req.params.id)
                : purchaseModel.performance;
            //予約中
            if (purchaseModel.reserveSeats !== null) {
                if (purchaseModel.authorizationCOA === null)
                    throw ErrorUtilModule.ERROR_PROPERTY;
                const reserveSeats = purchaseModel.reserveSeats;
                //COA仮予約削除
                yield COA.services.reserve.delTmpReserve({
                    theater_code: performance.attributes.theater.id,
                    date_jouei: performance.attributes.day,
                    title_code: purchaseModel.performanceCOA.titleCode,
                    title_branch_num: purchaseModel.performanceCOA.titleBranchNum,
                    time_begin: performance.attributes.time_start,
                    tmp_reserve_num: reserveSeats.tmp_reserve_num
                });
                log('COA仮予約削除');
                // COAオーソリ削除
                yield MP.removeCOAAuthorization({
                    transactionId: purchaseModel.transactionMP.id,
                    coaAuthorizationId: purchaseModel.authorizationCOA.id
                });
                log('MPCOAオーソリ削除');
            }
            //COA仮予約
            purchaseModel.reserveSeats = yield COA.services.reserve.updTmpReserveSeat({
                theater_code: purchaseModel.performance.attributes.theater.id,
                date_jouei: purchaseModel.performance.attributes.day,
                title_code: purchaseModel.performanceCOA.titleCode,
                title_branch_num: purchaseModel.performanceCOA.titleBranchNum,
                time_begin: purchaseModel.performance.attributes.time_start,
                // cnt_reserve_seat: number,
                screen_code: purchaseModel.performanceCOA.screenCode,
                list_seat: selectSeats
            });
            log('COA仮予約', purchaseModel.reserveSeats);
            if (purchaseModel.salesTicketsCOA === null) {
                //コアAPI券種取得
                purchaseModel.salesTicketsCOA = yield COA.services.reserve.salesTicket({
                    theater_code: purchaseModel.performance.attributes.theater.id,
                    date_jouei: purchaseModel.performance.attributes.day,
                    title_code: purchaseModel.performanceCOA.titleCode,
                    title_branch_num: purchaseModel.performanceCOA.titleBranchNum,
                    time_begin: purchaseModel.performance.attributes.time_start
                    // flg_member: COA.services.reserve.FlgMember.NonMember
                });
                log('コアAPI券種取得', purchaseModel.salesTicketsCOA);
            }
            //コアAPI券種取得
            const salesTickets = purchaseModel.salesTicketsCOA;
            purchaseModel.reserveTickets = [];
            //予約チケット作成
            const tmpReserveTickets = purchaseModel.reserveSeats.list_tmp_reserve.map((tmpReserve) => {
                return {
                    section: tmpReserve.seat_section,
                    seat_code: tmpReserve.seat_num,
                    ticket_code: salesTickets[0].ticket_code,
                    ticket_name: salesTickets[0].ticket_name,
                    ticket_name_eng: salesTickets[0].ticket_name_eng,
                    ticket_name_kana: salesTickets[0].ticket_name_kana,
                    std_price: salesTickets[0].std_price,
                    add_price: salesTickets[0].add_price,
                    dis_price: 0,
                    sale_price: salesTickets[0].sale_price,
                    add_price_glasses: 0,
                    glasses: false,
                    mvtk_app_price: 0,
                    add_glasses: 0,
                    kbn_eisyahousiki: '00',
                    mvtk_num: '',
                    mvtk_kbn_denshiken: '00',
                    mvtk_kbn_maeuriken: '00',
                    mvtk_kbn_kensyu: '00',
                    mvtk_sales_price: 0 // ムビチケ販売単価
                };
            });
            let price = 0;
            for (const tmpReserveTicket of tmpReserveTickets) {
                price += tmpReserveTicket.sale_price;
            }
            //COAオーソリ追加
            const coaAuthorizationResult = yield MP.addCOAAuthorization({
                transaction: purchaseModel.transactionMP,
                reserveSeatsTemporarilyResult: purchaseModel.reserveSeats,
                salesTicketResults: tmpReserveTickets,
                performance: purchaseModel.performance,
                performanceCOA: purchaseModel.performanceCOA,
                price: price
            });
            log('MPCOAオーソリ追加', coaAuthorizationResult);
            purchaseModel.authorizationCOA = coaAuthorizationResult;
            purchaseModel.authorizationCountGMO = 0;
            log('GMOオーソリカウント初期化');
>>>>>>> feature/SSKTS-543
            //セッション更新
            purchaseModel.save(req.session);
            // ムビチケセッション削除
            delete req.session.mvtk;
            //券種選択へ
            res.redirect('/purchase/ticket');
            return;
        }
        catch (err) {
            const error = (err instanceof Error)
                ? new ErrorUtilModule.CustomError(ErrorUtilModule.ERROR_EXTERNAL_MODULE, err.message)
                : new ErrorUtilModule.CustomError(err, undefined);
            next(error);
            return;
        }
    });
}
exports.select = select;
/**
<<<<<<< HEAD
 * 座席仮予約
 * @memberof Purchase.SeatModule
 * @function reserve
 * @param {Request} req
 * @param {ReserveSeats[]} reserveSeats
 * @param {PurchaseSession.PurchaseModel} purchaseModel
 * @returns {Promise<void>}
 */
// tslint:disable-next-line:max-func-body-length
function reserve(req, selectSeats, purchaseModel) {
    return __awaiter(this, void 0, void 0, function* () {
        if (req.session === undefined)
            throw ErrorUtilModule.ERROR_PROPERTY;
        if (purchaseModel.individualScreeningEvent === null)
            throw ErrorUtilModule.ERROR_PROPERTY;
        if (purchaseModel.transaction === null)
            throw ErrorUtilModule.ERROR_PROPERTY;
        const authModel = new AuthModel_1.AuthModel(req.session.auth);
        const auth = authModel.create();
        //予約中
        if (purchaseModel.seatReservationAuthorization !== null) {
            yield ssktsApi.service.transaction.placeOrder.cancelSeatReservationAuthorization({
                auth: auth,
                transactionId: purchaseModel.transaction.id,
                authorizationId: purchaseModel.seatReservationAuthorization.id
            });
            log('仮予約削除');
        }
        if (purchaseModel.salesTickets === null) {
            //コアAPI券種取得
            const salesTicketResult = yield COA.services.reserve.salesTicket({
                theaterCode: purchaseModel.individualScreeningEvent.coaInfo.theaterCode,
                dateJouei: purchaseModel.individualScreeningEvent.coaInfo.dateJouei,
                titleCode: purchaseModel.individualScreeningEvent.coaInfo.titleCode,
                titleBranchNum: purchaseModel.individualScreeningEvent.coaInfo.titleBranchNum,
                timeBegin: purchaseModel.individualScreeningEvent.coaInfo.timeBegin
            });
            purchaseModel.salesTickets = salesTicketResult;
            log('コアAPI券種取得', purchaseModel.salesTickets);
        }
        purchaseModel.seatReservationAuthorization = yield ssktsApi.service.transaction.placeOrder.createSeatReservationAuthorization({
            auth: auth,
            transactionId: purchaseModel.transaction.id,
            eventIdentifier: purchaseModel.individualScreeningEvent.identifier,
            offers: selectSeats.map((seat) => {
                const salesTicket = purchaseModel.salesTickets[0];
                return {
                    seatSection: seat.seatSection,
                    seatNumber: seat.seatNum,
                    ticket: {
                        ticketCode: salesTicket.ticketCode,
                        ticketName: salesTicket.ticketName,
                        ticketNameEng: salesTicket.ticketNameEng,
                        ticketNameKana: salesTicket.ticketNameKana,
                        stdPrice: salesTicket.stdPrice,
                        addPrice: salesTicket.addPrice,
                        disPrice: 0,
                        salePrice: salesTicket.salePrice,
                        mvtkAppPrice: 0,
                        ticketCount: 1,
                        seatNum: seat.seatNum,
                        addGlasses: 0,
                        kbnEisyahousiki: '00',
                        mvtkNum: '',
                        mvtkKbnDenshiken: '00',
                        mvtkKbnMaeuriken: '00',
                        mvtkKbnKensyu: '00',
                        mvtkSalesPrice: 0
                    }
                };
            })
        });
        log('SSKTSオーソリ追加', purchaseModel.seatReservationAuthorization);
        purchaseModel.orderCount = 0;
        log('GMOオーソリカウント初期化');
    });
}
/**
=======
>>>>>>> feature/SSKTS-543
 * スクリーン状態取得
 * @memberof Purchase.SeatModule
 * @function getScreenStateReserve
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns {Promise<void>}
 */
function getScreenStateReserve(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            //バリデーション
            seatForm.screenStateReserve(req);
            const validationResult = yield req.getValidationResult();
            if (!validationResult.isEmpty())
                throw ErrorUtilModule.ERROR_VALIDATION;
            const theaterCode = `00${req.body.theaterCode}`.slice(UtilModule.DIGITS_02);
            const screenCode = `000${req.body.screenCode}`.slice(UtilModule.DIGITS_03);
            const screen = yield fs.readJSON(`./app/theaters/${theaterCode}/${screenCode}.json`);
            const setting = yield fs.readJSON('./app/theaters/setting.json');
            const state = yield COA.services.reserve.stateReserveSeat({
                theaterCode: req.body.theaterCode,
                dateJouei: req.body.dateJouei,
                titleCode: req.body.titleCode,
                titleBranchNum: req.body.titleBranchNum,
                timeBegin: req.body.timeBegin,
                screenCode: req.body.screenCode // スクリーンコード
            });
            res.json({
                err: null,
                result: {
                    screen: screen,
                    setting: setting,
                    state: state
                }
            });
        }
        catch (err) {
            res.json({ err: err, result: null });
        }
    });
}
exports.getScreenStateReserve = getScreenStateReserve;
/**
 * 券種情報をセションへ保存
 * @memberof Purchase.SeatModule
 * @function getSalesTickets
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns {Promise<void>}
 */
function saveSalesTickets(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            //バリデーション
            seatForm.salesTickets(req);
            const validationResult = yield req.getValidationResult();
            if (!validationResult.isEmpty())
                throw ErrorUtilModule.ERROR_VALIDATION;
            if (req.session === undefined)
                throw ErrorUtilModule.ERROR_PROPERTY;
            if (req.session.purchase === undefined)
                throw ErrorUtilModule.ERROR_EXPIRE;
<<<<<<< HEAD
            const purchaseModel = new PurchaseModel_1.PurchaseModel(req.session.purchase);
            if (purchaseModel.salesTickets === null) {
                //コアAPI券種取得
                purchaseModel.salesTickets = yield COA.services.reserve.salesTicket({
                    theaterCode: req.body.theaterCode,
                    dateJouei: req.body.dateJouei,
                    titleCode: req.body.titleCode,
                    titleBranchNum: req.body.titleBranchNum,
                    timeBegin: req.body.timeBegin
                    // flgMember: coa.services.reserve.FlgMember.NonMember
                });
                log('コアAPI券種取得', purchaseModel.salesTickets);
                purchaseModel.save(req.session);
                res.json({ err: null });
            }
            else {
                res.json({ err: null });
            }
=======
            const purchaseModel = new PurchaseSession.PurchaseModel(req.session.purchase);
            //コアAPI券種取得
            purchaseModel.salesTicketsCOA = yield COA.services.reserve.salesTicket({
                theater_code: req.body.theater_code,
                date_jouei: req.body.date_jouei,
                title_code: req.body.title_code,
                title_branch_num: req.body.title_branch_num,
                time_begin: req.body.time_begin
                // flg_member: COA.services.reserve.FlgMember.NonMember
            });
            log('コアAPI券種取得', purchaseModel.salesTicketsCOA);
            req.session.purchase = purchaseModel.toSession();
            res.json({ err: null });
>>>>>>> feature/SSKTS-543
        }
        catch (err) {
            res.json({ err: err });
        }
    });
}
exports.saveSalesTickets = saveSalesTickets;
