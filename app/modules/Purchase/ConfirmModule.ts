/**
 * 購入確認
 * @namespace Purchase.ConfirmModule
 */
import * as COA from '@motionpicture/coa-service';
import * as MVTK from '@motionpicture/mvtk-service';
import * as debug from 'debug';
import { NextFunction, Request, Response } from 'express';
import * as moment from 'moment';
import * as MP from '../../../libs/MP';
import logger from '../../middlewares/logger';
import * as PurchaseSession from '../../models/Purchase/PurchaseModel';
import * as ErrorUtilModule from '../Util/ErrorUtilModule';
import * as UtilModule from '../Util/UtilModule';
import * as MvtkUtilModule from './Mvtk/MvtkUtilModule';
const log = debug('SSKTS:Purchase.ConfirmModule');

/**
 * 購入者内容確認
 * @memberof Purchase.ConfirmModule
 * @function index
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns {Promise<void>}
 */
export async function index(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        if (req.session === undefined) throw ErrorUtilModule.ERROR_PROPERTY;
        if (req.session.purchase === undefined) throw ErrorUtilModule.ERROR_EXPIRE;
        const purchaseModel = new PurchaseSession.PurchaseModel(req.session.purchase);
        if (purchaseModel.isExpired()) throw ErrorUtilModule.ERROR_EXPIRE;
        if (!purchaseModel.accessAuth(PurchaseSession.PurchaseModel.CONFIRM_STATE)) {
            throw ErrorUtilModule.ERROR_EXPIRE;
        }
        if (purchaseModel.transactionMP === null) throw ErrorUtilModule.ERROR_PROPERTY;
        if (purchaseModel.theater === null) throw ErrorUtilModule.ERROR_PROPERTY;
        const website = purchaseModel.theater.attributes.websites.find((value) => {
            return (value.group === 'PORTAL');
        });

        //購入者内容確認表示
        res.locals.gmoTokenObject = (purchaseModel.gmo !== null) ? purchaseModel.gmo : null;
        res.locals.input = purchaseModel.input;
        res.locals.performance = purchaseModel.performance;
        res.locals.reserveSeats = purchaseModel.reserveSeats;
        res.locals.reserveTickets = purchaseModel.reserveTickets;
        res.locals.price = purchaseModel.getReserveAmount();
        res.locals.updateReserve = null;
        res.locals.error = null;
        res.locals.transactionId = purchaseModel.transactionMP.id;
        res.locals.portalTheaterSite = (website !== undefined) ? website.url : process.env.PORTAL_SITE_URL;
        res.locals.step = PurchaseSession.PurchaseModel.CONFIRM_STATE;
        //セッション更新
        req.session.purchase = purchaseModel.toSession();
        res.render('purchase/confirm', { layout: 'layouts/purchase/layout' });

        return;
    } catch (err) {
        const error = (err instanceof Error)
            ? new ErrorUtilModule.CustomError(ErrorUtilModule.ERROR_EXTERNAL_MODULE, err.message)
            : new ErrorUtilModule.CustomError(err, undefined);
        next(error);

        return;
    }
}

/**
 * ムビチケ決済
 * @memberof Purchase.ConfirmModule
 * @function reserveMvtk
 * @param {PurchaseSession.PurchaseModel} purchaseModel
 * @returns {Promise<void>}
 */
async function reserveMvtk(purchaseModel: PurchaseSession.PurchaseModel): Promise<void> {
    if (purchaseModel.reserveTickets === null) throw ErrorUtilModule.ERROR_PROPERTY;
    if (purchaseModel.reserveSeats === null) throw ErrorUtilModule.ERROR_PROPERTY;
    if (purchaseModel.performance === null) throw ErrorUtilModule.ERROR_PROPERTY;
    if (purchaseModel.mvtk === null) throw ErrorUtilModule.ERROR_PROPERTY;
    if (purchaseModel.performanceCOA === null) throw ErrorUtilModule.ERROR_PROPERTY;
    if (purchaseModel.transactionMP === null) throw ErrorUtilModule.ERROR_PROPERTY;
    // 購入管理番号情報
    const mvtk = MvtkUtilModule.createMvtkInfo(purchaseModel.reserveTickets, purchaseModel.mvtk);
    const mvtkTickets = mvtk.tickets;
    const mvtkSeats = mvtk.seats;

    log('購入管理番号情報', mvtkTickets);
    if (mvtkTickets.length === 0 || mvtkSeats.length === 0) throw ErrorUtilModule.ERROR_ACCESS;
    const mvtkFilmCode = MvtkUtilModule.getfilmCode(
        purchaseModel.performanceCOA.titleCode,
        purchaseModel.performanceCOA.titleBranchNum);
    // 興行会社ユーザー座席予約番号(予約番号)
    const startDate = {
        day: `${moment(purchaseModel.performance.attributes.day).format('YYYY/MM/DD')}`,
        time: `${UtilModule.timeFormat(purchaseModel.performance.attributes.time_start)}:00`
    };
    const seatInfoSyncService = MVTK.createSeatInfoSyncService();
    const seatInfoSyncIn = {
        kgygishCd: MvtkUtilModule.COMPANY_CODE, // 興行会社コード
        yykDvcTyp: MVTK.SeatInfoSyncUtilities.RESERVED_DEVICE_TYPE_ENTERTAINER_SITE_PC, // 予約デバイス区分
        trkshFlg: MVTK.SeatInfoSyncUtilities.DELETE_FLAG_FALSE, // 取消フラグ
        kgygishSstmZskyykNo: `${purchaseModel.performance.attributes.day}${purchaseModel.reserveSeats.tmp_reserve_num}`, // 興行会社システム座席予約番号
        kgygishUsrZskyykNo: String(purchaseModel.reserveSeats.tmp_reserve_num), // 興行会社ユーザー座席予約番号
        jeiDt: `${startDate.day} ${startDate.time}`, // 上映日時
        kijYmd: startDate.day, // 計上年月日
        stCd: MvtkUtilModule.getSiteCode(purchaseModel.performance.attributes.theater.id), // サイトコード
        screnCd: purchaseModel.performanceCOA.screenCode, // スクリーンコード
        knyknrNoInfo: mvtkTickets, // 購入管理番号情報
        zskInfo: mvtkSeats, // 座席情報（itemArray）
        skhnCd: mvtkFilmCode// 作品コード
    };
    try {
        const seatInfoSyncInResult = await seatInfoSyncService.seatInfoSync(seatInfoSyncIn);
        if (seatInfoSyncInResult.zskyykResult !== MVTK.SeatInfoSyncUtilities.RESERVATION_SUCCESS) throw ErrorUtilModule.ERROR_ACCESS;
    } catch (err) {
        logger.error('SSKTS-APP:ConfirmModule.reserveMvtk In', seatInfoSyncIn);
        logger.error('SSKTS-APP:ConfirmModule.reserveMvtk Out', err);
        throw err;
    }
    log('MVTKムビチケ着券');
    log('GMO', purchaseModel.getReserveAmount());
    log('MVTK', purchaseModel.getMvtkPrice());
    log('FULL', purchaseModel.getPrice());
}

/**
 * ムビチケ決済取り消し
 * @memberof Purchase.ConfirmModule
 * @function cancelMvtk
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export async function cancelMvtk(req: Request, res: Response): Promise<void> {
    if (req.session === undefined) throw ErrorUtilModule.ERROR_PROPERTY;
    if (req.session.purchase === undefined) throw ErrorUtilModule.ERROR_EXPIRE;
    const purchaseModel = new PurchaseSession.PurchaseModel(req.session.purchase);
    if (purchaseModel.performance === null) throw ErrorUtilModule.ERROR_PROPERTY;
    if (purchaseModel.mvtk === null) throw ErrorUtilModule.ERROR_PROPERTY;
    if (purchaseModel.performanceCOA === null) throw ErrorUtilModule.ERROR_PROPERTY;
    if (purchaseModel.reserveTickets === null) throw ErrorUtilModule.ERROR_PROPERTY;
    if (purchaseModel.reserveSeats === null) throw ErrorUtilModule.ERROR_PROPERTY;

    // 購入管理番号情報
    const mvtk = MvtkUtilModule.createMvtkInfo(purchaseModel.reserveTickets, purchaseModel.mvtk);
    const mvtkTickets = mvtk.tickets;
    const mvtkSeats = mvtk.seats;

    log('購入管理番号情報', mvtkTickets);
    if (mvtkTickets.length === 0 || mvtkSeats.length === 0) throw ErrorUtilModule.ERROR_ACCESS;
    const mvtkFilmCode = MvtkUtilModule.getfilmCode(
        purchaseModel.performanceCOA.titleCode,
        purchaseModel.performanceCOA.titleBranchNum);
    // 興行会社ユーザー座席予約番号(予約番号)
    const startDate = {
        day: `${moment(purchaseModel.performance.attributes.day).format('YYYY/MM/DD')}`,
        time: `${UtilModule.timeFormat(purchaseModel.performance.attributes.time_start)}:00`
    };
    const seatInfoSyncService = MVTK.createSeatInfoSyncService();
    const seatInfoSyncIn = {
        kgygishCd: MvtkUtilModule.COMPANY_CODE, // 興行会社コード
        yykDvcTyp: MVTK.SeatInfoSyncUtilities.RESERVED_DEVICE_TYPE_ENTERTAINER_SITE_PC, // 予約デバイス区分
        trkshFlg: MVTK.SeatInfoSyncUtilities.DELETE_FLAG_TRUE, // 取消フラグ
        kgygishSstmZskyykNo: `${purchaseModel.performance.attributes.day}${purchaseModel.reserveSeats.tmp_reserve_num}`, // 興行会社システム座席予約番号
        kgygishUsrZskyykNo: String(purchaseModel.reserveSeats.tmp_reserve_num), // 興行会社ユーザー座席予約番号
        jeiDt: `${startDate.day} ${startDate.time}`, // 上映日時
        kijYmd: startDate.day, // 計上年月日
        stCd: MvtkUtilModule.getSiteCode(purchaseModel.performance.attributes.theater.id), // サイトコード
        screnCd: purchaseModel.performanceCOA.screenCode, // スクリーンコード
        knyknrNoInfo: mvtkTickets, // 購入管理番号情報
        zskInfo: mvtkSeats, // 座席情報（itemArray）
        skhnCd: mvtkFilmCode// 作品コード
    };
    let result = true;
    try {
        const seatInfoSyncInResult = await seatInfoSyncService.seatInfoSync(seatInfoSyncIn);
        if (seatInfoSyncInResult.zskyykResult !== MVTK.SeatInfoSyncUtilities.RESERVATION_CANCEL_SUCCESS) throw ErrorUtilModule.ERROR_ACCESS;
    } catch (err) {
        result = false;
        logger.error('SSKTS-APP:ConfirmModule.reserveMvtk In', seatInfoSyncIn);
        logger.error('SSKTS-APP:ConfirmModule.reserveMvtk Out', err);
    }
    //購入セッション削除
    delete req.session.purchase;
    //ムビチケセッション削除
    delete req.session.mvtk;
    log('MVTKムビチケ着券削除');
    res.json({ isSuccess: result });
}

/**
 * 購入確定
 * @memberof Purchase.ConfirmModule
 * @function purchase
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 * @description フロー(本予約成功、本予約失敗、購入期限切れ)
 */
// tslint:disable-next-line:max-func-body-length
export async function purchase(req: Request, res: Response): Promise<void> {
    try {
        if (req.session === undefined) throw ErrorUtilModule.ERROR_PROPERTY;
        if (req.session.purchase === undefined) throw ErrorUtilModule.ERROR_EXPIRE;
        const purchaseModel = new PurchaseSession.PurchaseModel(req.session.purchase);
        if (purchaseModel.transactionMP === null) throw ErrorUtilModule.ERROR_PROPERTY;
        if (purchaseModel.performance === null) throw ErrorUtilModule.ERROR_PROPERTY;
        if (purchaseModel.performanceCOA === null) throw ErrorUtilModule.ERROR_PROPERTY;
        if (purchaseModel.reserveSeats === null) throw ErrorUtilModule.ERROR_PROPERTY;
        if (purchaseModel.reserveTickets === null) throw ErrorUtilModule.ERROR_PROPERTY;
        if (purchaseModel.input === null) throw ErrorUtilModule.ERROR_PROPERTY;

        //取引id確認
        if (req.body.transaction_id !== purchaseModel.transactionMP.id) throw ErrorUtilModule.ERROR_ACCESS;

        //購入期限切れ
        if (purchaseModel.isExpired()) {
            delete req.session.purchase;
            throw ErrorUtilModule.ERROR_EXPIRE;
        }

        // ムビチケ使用
        if (purchaseModel.mvtk !== null) {
            await reserveMvtk(purchaseModel);
            log('ムビチケ決済');
        }

        // MP取引成立
        await MP.transactionClose({
            transactionId: purchaseModel.transactionMP.id
        });
        log('MP取引成立');
        //購入情報をセッションへ
        req.session.complete = {
            performance: purchaseModel.performance,
            input: purchaseModel.input,
            reserveSeats: purchaseModel.reserveSeats,
            reserveTickets: purchaseModel.reserveTickets,
            price: purchaseModel.getReserveAmount()
        };
        if (process.env.VIEW_TYPE === 'fixed') {
            // 本予約に必要な情報を印刷セッションへ
            const updateReserveIn: COA.ReserveService.IUpdReserveArgs = {
                theater_code: purchaseModel.performance.attributes.theater.id,
                date_jouei: purchaseModel.performance.attributes.day,
                title_code: purchaseModel.performanceCOA.titleCode,
                title_branch_num: purchaseModel.performanceCOA.titleBranchNum,
                time_begin: purchaseModel.performance.attributes.time_start,
                tmp_reserve_num: purchaseModel.reserveSeats.tmp_reserve_num,
                reserve_name: `${purchaseModel.input.last_name_hira}　${purchaseModel.input.first_name_hira}`,
                reserve_name_jkana: `${purchaseModel.input.last_name_hira}　${purchaseModel.input.first_name_hira}`,
                tel_num: purchaseModel.input.tel_num,
                mail_addr: purchaseModel.input.mail_addr,
                reserve_amount: purchaseModel.getReserveAmount(),
                list_ticket: purchaseModel.reserveTickets.map((ticket) => {
                    let mvtkTicket: PurchaseSession.IMvtk | undefined;
                    if (purchaseModel.mvtk !== null) {
                        mvtkTicket = purchaseModel.mvtk.find((value) => {
                            return (value.code === ticket.mvtk_num && value.ticket.ticket_code === ticket.ticket_code);
                        });
                    }

                    return {
                        ticket_code: ticket.ticket_code,
                        std_price: ticket.std_price,
                        add_price: ticket.add_price,
                        dis_price: 0,
                        sale_price: (ticket.std_price + ticket.add_price),
                        ticket_count: 1,
                        mvtk_app_price: ticket.mvtk_app_price,
                        seat_num: ticket.seat_code,
                        add_glasses: (ticket.glasses) ? ticket.add_price_glasses : 0,
                        kbn_eisyahousiki: (mvtkTicket !== undefined) ? mvtkTicket.ykknInfo.eishhshkTyp : '00',
                        mvtk_num: (mvtkTicket !== undefined) ? mvtkTicket.code : '',
                        mvtk_kbn_denshiken: (mvtkTicket !== undefined) ? mvtkTicket.ykknInfo.dnshKmTyp : '00',
                        mvtk_kbn_maeuriken: (mvtkTicket !== undefined) ? mvtkTicket.ykknInfo.znkkkytsknGkjknTyp : '00',
                        mvtk_kbn_kensyu: (mvtkTicket !== undefined) ? mvtkTicket.ykknInfo.ykknshTyp : '00',
                        mvtk_sales_price: (mvtkTicket !== undefined) ? Number(mvtkTicket.ykknInfo.knshknhmbiUnip) : 0

                    };
                })
            };
            req.session.fixed = {
                updateReserveIn: updateReserveIn
            };
        }
        // 購入セッション削除
        delete req.session.purchase;
        // 購入完了情報を返す
        res.json({ err: null, result: req.session.complete });
    } catch (err) {
        log('ERROR', err);
        const msg: string = (err === ErrorUtilModule.ERROR_PROPERTY) ? req.__('common.error.property')
            : (err === ErrorUtilModule.ERROR_ACCESS) ? req.__('common.error.access')
                : (err === ErrorUtilModule.ERROR_EXPIRE) ? req.__('common.error.expire')
                    : err.message;
        res.json({ err: msg, result: null });
    }
}

/**
 * 完了情報取得
 * @function getCompleteData
 * @param {Request} req
 * @param {Response} res
 * @returns {void}
 */
export function getCompleteData(req: Request, res: Response): void {
    try {
        if (req.session === undefined) throw ErrorUtilModule.ERROR_PROPERTY;
        if (req.session.complete === undefined) throw ErrorUtilModule.ERROR_EXPIRE;
        res.json({ err: null, result: req.session.complete });
    } catch (err) {
        const msg: string = (err === ErrorUtilModule.ERROR_PROPERTY) ? req.__('common.error.property')
            : (err === ErrorUtilModule.ERROR_ACCESS) ? req.__('common.error.access')
                : (err === ErrorUtilModule.ERROR_EXPIRE) ? req.__('common.error.expire')
                    : err.message;
        res.json({ err: msg, result: null });
    }
}
