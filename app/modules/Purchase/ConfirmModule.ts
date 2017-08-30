/**
 * 購入確認
 * @namespace Purchase.ConfirmModule
 */
import * as COA from '@motionpicture/coa-service';
import * as MVTK from '@motionpicture/mvtk-service';
import * as sasaki from '@motionpicture/sasaki-api-nodejs';
import * as debug from 'debug';
import { NextFunction, Request, Response } from 'express';
import logger from '../../middlewares/logger';
import { AuthModel } from '../../models/Auth/AuthModel';
import { IMvtk, PurchaseModel } from '../../models/Purchase/PurchaseModel';
import * as ErrorUtilModule from '../Util/ErrorUtilModule';
import * as UtilModule from '../Util/UtilModule';
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
        const purchaseModel = new PurchaseModel(req.session.purchase);
        if (purchaseModel.isExpired()) throw ErrorUtilModule.ERROR_EXPIRE;
        if (!purchaseModel.accessAuth(PurchaseModel.CONFIRM_STATE)) {
            throw ErrorUtilModule.ERROR_EXPIRE;
        }

        //購入者内容確認表示
        res.locals.updateReserve = null;
        res.locals.error = null;
        res.locals.purchaseModel = purchaseModel;
        res.locals.step = PurchaseModel.CONFIRM_STATE;
        //セッション更新
        purchaseModel.save(req.session);
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
async function reserveMvtk(purchaseModel: PurchaseModel): Promise<void> {
    // 購入管理番号情報
    const mvtkSeatInfoSync = purchaseModel.getMvtkSeatInfoSync();
    log('購入管理番号情報', mvtkSeatInfoSync);
    if (mvtkSeatInfoSync === null) throw ErrorUtilModule.ERROR_ACCESS;
    const seatInfoSyncService = MVTK.createSeatInfoSyncService();
    const seatInfoSyncIn = {
        kgygishCd: mvtkSeatInfoSync.kgygishCd, // 興行会社コード
        yykDvcTyp: mvtkSeatInfoSync.yykDvcTyp, // 予約デバイス区分
        trkshFlg: mvtkSeatInfoSync.trkshFlg, // 取消フラグ
        kgygishSstmZskyykNo: mvtkSeatInfoSync.kgygishSstmZskyykNo, // 興行会社システム座席予約番号
        kgygishUsrZskyykNo: mvtkSeatInfoSync.kgygishUsrZskyykNo, // 興行会社ユーザー座席予約番号
        jeiDt: mvtkSeatInfoSync.jeiDt, // 上映日時
        kijYmd: mvtkSeatInfoSync.kijYmd, // 計上年月日
        stCd: mvtkSeatInfoSync.stCd, // サイトコード
        screnCd: mvtkSeatInfoSync.screnCd, // スクリーンコード
        knyknrNoInfo: mvtkSeatInfoSync.knyknrNoInfo.map((knyknrNoInfo) => {
            return {
                KNYKNR_NO: knyknrNoInfo.knyknrNo,
                PIN_CD: knyknrNoInfo.pinCd,
                KNSH_INFO: knyknrNoInfo.knshInfo.map((knshInfo) => {
                    return {
                        KNSH_TYP: knshInfo.knshTyp,
                        MI_NUM: String(knshInfo.miNum)
                    };
                })
            };
        }), // 購入管理番号情報
        zskInfo: mvtkSeatInfoSync.zskInfo.map((zskInfo) => {
            return {
                ZSK_CD: zskInfo.zskCd
            };
        }), // 座席情報（itemArray）
        skhnCd: mvtkSeatInfoSync.skhnCd // 作品コード
    };
    try {
        const seatInfoSyncInResult = await seatInfoSyncService.seatInfoSync(seatInfoSyncIn);
        if (seatInfoSyncInResult.zskyykResult !== MVTK.SeatInfoSyncUtilities.RESERVATION_SUCCESS) throw ErrorUtilModule.ERROR_ACCESS;
    } catch (err) {
        logger.error(
            'SSKTS-APP:ConfirmModule reserveMvtk',
            `in: ${seatInfoSyncIn}`,
            `err: ${err}`
        );
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
    const purchaseModel = new PurchaseModel(req.session.purchase);
    // 購入管理番号情報
    const mvtkSeatInfoSync = purchaseModel.getMvtkSeatInfoSync();
    log('購入管理番号情報', mvtkSeatInfoSync);
    if (mvtkSeatInfoSync === null) throw ErrorUtilModule.ERROR_ACCESS;
    const seatInfoSyncService = MVTK.createSeatInfoSyncService();
    const seatInfoSyncIn = {
        kgygishCd: mvtkSeatInfoSync.kgygishCd, // 興行会社コード
        yykDvcTyp: mvtkSeatInfoSync.yykDvcTyp, // 予約デバイス区分
        trkshFlg: mvtkSeatInfoSync.trkshFlg, // 取消フラグ
        kgygishSstmZskyykNo: mvtkSeatInfoSync.kgygishSstmZskyykNo, // 興行会社システム座席予約番号
        kgygishUsrZskyykNo: mvtkSeatInfoSync.kgygishUsrZskyykNo, // 興行会社ユーザー座席予約番号
        jeiDt: mvtkSeatInfoSync.jeiDt, // 上映日時
        kijYmd: mvtkSeatInfoSync.kijYmd, // 計上年月日
        stCd: mvtkSeatInfoSync.stCd, // サイトコード
        screnCd: mvtkSeatInfoSync.screnCd, // スクリーンコード
        knyknrNoInfo: mvtkSeatInfoSync.knyknrNoInfo.map((knyknrNoInfo) => {
            return {
                KNYKNR_NO: knyknrNoInfo.knyknrNo,
                PIN_CD: knyknrNoInfo.pinCd,
                KNSH_INFO: knyknrNoInfo.knshInfo.map((knshInfo) => {
                    return {
                        KNSH_TYP: knshInfo.knshTyp,
                        MI_NUM: String(knshInfo.miNum)
                    };
                })
            };
        }), // 購入管理番号情報
        zskInfo: mvtkSeatInfoSync.zskInfo.map((zskInfo) => {
            return {
                ZSK_CD: zskInfo.zskCd
            };
        }), // 座席情報（itemArray）
        skhnCd: mvtkSeatInfoSync.skhnCd // 作品コード
    };
    let result = true;
    try {
        const seatInfoSyncInResult = await seatInfoSyncService.seatInfoSync(seatInfoSyncIn);
        if (seatInfoSyncInResult.zskyykResult !== MVTK.SeatInfoSyncUtilities.RESERVATION_CANCEL_SUCCESS) throw ErrorUtilModule.ERROR_ACCESS;
    } catch (err) {
        result = false;
        logger.error(
            'SSKTS-APP:ConfirmModule reserveMvtk',
            `in: ${seatInfoSyncIn}`,
            `err: ${err}`
        );
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
        const authModel = new AuthModel(req.session.auth);
        const options = {
            endpoint: process.env.SSKTS_API_ENDPOINT,
            auth: authModel.create()
        };
        if (req.session.purchase === undefined) throw ErrorUtilModule.ERROR_EXPIRE;
        const purchaseModel = new PurchaseModel(req.session.purchase);
        if (purchaseModel.transaction === null) throw ErrorUtilModule.ERROR_PROPERTY;
        if (purchaseModel.profile === null) throw ErrorUtilModule.ERROR_PROPERTY;
        if (purchaseModel.individualScreeningEvent === null) throw ErrorUtilModule.ERROR_PROPERTY;
        if (purchaseModel.seatReservationAuthorization === null) throw ErrorUtilModule.ERROR_PROPERTY;
        //取引id確認
        if (req.body.transactionId !== purchaseModel.transaction.id) throw ErrorUtilModule.ERROR_ACCESS;

        //購入期限切れ
        if (purchaseModel.isExpired()) {
            delete req.session.purchase;
            throw ErrorUtilModule.ERROR_EXPIRE;
        }
        const mvtkTickets = purchaseModel.reserveTickets.filter((ticket) => {
            return (ticket.mvtkNum !== '');
        });
        log('ムビチケ券', mvtkTickets);
        // ムビチケ使用
        if (purchaseModel.mvtk !== null && mvtkTickets.length > 0) {
            await reserveMvtk(purchaseModel);
            log('ムビチケ決済');
        }

        const order = await sasaki.service.transaction.placeOrder(options).confirm({
            transactionId: purchaseModel.transaction.id
        });
        log('注文確定', order);

        //購入情報をセッションへ
        req.session.complete = {
            individualScreeningEvent: purchaseModel.individualScreeningEvent,
            profile: purchaseModel.profile,
            seatReservationAuthorization: purchaseModel.seatReservationAuthorization,
            reserveTickets: purchaseModel.reserveTickets
        };
        if (process.env.VIEW_TYPE === UtilModule.VIEW.Fixed) {
            // 本予約に必要な情報を印刷セッションへ
            const updateReserveIn: COA.services.reserve.IUpdReserveArgs = {
                theaterCode: purchaseModel.individualScreeningEvent.coaInfo.theaterCode,
                dateJouei: purchaseModel.individualScreeningEvent.coaInfo.dateJouei,
                titleCode: purchaseModel.individualScreeningEvent.coaInfo.titleCode,
                titleBranchNum: purchaseModel.individualScreeningEvent.coaInfo.titleBranchNum,
                timeBegin: purchaseModel.individualScreeningEvent.coaInfo.timeBegin,
                tmpReserveNum: purchaseModel.seatReservationAuthorization.result.tmpReserveNum,
                reserveName: `${purchaseModel.profile.familyName}　${purchaseModel.profile.givenName}`,
                reserveNameJkana: `${purchaseModel.profile.familyName}　${purchaseModel.profile.givenName}`,
                telNum: purchaseModel.profile.telephone,
                mailAddr: purchaseModel.profile.email,
                reserveAmount: purchaseModel.getReserveAmount(),
                listTicket: purchaseModel.reserveTickets.map((ticket) => {
                    let mvtkTicket: IMvtk | undefined;
                    if (purchaseModel.mvtk !== null) {
                        mvtkTicket = purchaseModel.mvtk.find((value) => {
                            return (value.code === ticket.mvtkNum && value.ticket.ticketCode === ticket.ticketCode);
                        });
                    }

                    return {
                        ticketCode: ticket.ticketCode,
                        stdPrice: ticket.stdPrice,
                        addPrice: ticket.addPrice,
                        disPrice: 0,
                        salePrice: (ticket.stdPrice + ticket.addPrice),
                        ticketCount: 1,
                        mvtkAppPrice: ticket.mvtkAppPrice,
                        seatNum: ticket.seatCode,
                        addGlasses: (ticket.glasses) ? ticket.addPriceGlasses : 0,
                        kbnEisyahousiki: (mvtkTicket !== undefined) ? mvtkTicket.ykknInfo.eishhshkTyp : '00',
                        mvtkNum: (mvtkTicket !== undefined) ? mvtkTicket.code : '',
                        mvtkKbnDenshiken: (mvtkTicket !== undefined) ? mvtkTicket.ykknInfo.dnshKmTyp : '00',
                        mvtkKbnMaeuriken: (mvtkTicket !== undefined) ? mvtkTicket.ykknInfo.znkkkytsknGkjknTyp : '00',
                        mvtkKbnKensyu: (mvtkTicket !== undefined) ? mvtkTicket.ykknInfo.ykknshTyp : '00',
                        mvtkSalesPrice: (mvtkTicket !== undefined) ? Number(mvtkTicket.ykknInfo.knshknhmbiUnip) : 0

                    };
                })
            };
            req.session.fixed = {
                updateReserveIn: updateReserveIn
            };
        } else {
            const content = await UtilModule.getEmailTemplate(
                res,
                `email/complete/${req.__('lang')}`,
                {
                    purchaseModel: purchaseModel,
                    domain: req.headers.host
                }
            );
            await sasaki.service.transaction.placeOrder(options).sendEmailNotification({
                transactionId: purchaseModel.transaction.id,
                emailNotification: {
                    from: 'noreply@ticket-cinemasunshine.com',
                    to: purchaseModel.profile.email,
                    subject: `${purchaseModel.individualScreeningEvent.superEvent.location.name.ja} 購入完了`,
                    content: content,
                    send_at: new Date()
                }
            });
            log('メール通知');
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
 * @memberof Purchase.ConfirmModule
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
