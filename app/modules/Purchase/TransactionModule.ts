/**
 * 取引
 * @namespace Purchase.TransactionModule
 */

import * as debug from 'debug';
import { Request, Response } from 'express';
import * as moment from 'moment';
import * as MP from '../../../libs/MP';
import * as PurchaseSession from '../../models/Purchase/PurchaseModel';
import * as ErrorUtilModule from '../Util/ErrorUtilModule';
import * as UtilModule from '../Util/UtilModule';
const log = debug('SSKTS:Purchase.TransactionModule');
/**
 * 販売終了時間 30分前
 * @const {number} END_TIME_DEFAULT
 */
const END_TIME_DEFAULT = 30;
/**
 * 販売終了時間(券売機) 10分後
 * @const {number} END_TIME_DEFAULT
 */
const END_TIME_FIXED = -10;

/**
 * 取引有効時間 15分間
 * @const {number} END_TIME_DEFAULT
 */
const VALID_TIME_DEFAULT = 15;
/**
 * 取引有効時間(券売機) 5分間
 * @const {number} END_TIME_DEFAULT
 */
const VALID_TIME_FIXED = 5;

/**
 * 取引開始
 * @memberof Purchase.TransactionModule
 * @function start
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns {Promise<void>}
 */
export async function start(req: Request, res: Response): Promise<void> {
    try {
        if (req.session === undefined || req.body.id === undefined) {
            throw ErrorUtilModule.ERROR_PROPERTY;
        }
        req.session.oauth = await login(<string>req.sessionID, req.body.username, req.body.password);
        const performance = await MP.services.performance.getPerformance({
            accessToken: await UtilModule.getAccessToken(req),
            performanceId: req.body.id
        });
        // 開始可能日判定
        if (moment().unix() < moment(`${performance.attributes.coa_rsv_start_date}`).unix()) {
            throw ErrorUtilModule.ERROR_ACCESS;
        }

        // 終了可能日判定
        const limit = (process.env.VIEW_TYPE === 'fixed') ? END_TIME_FIXED : END_TIME_DEFAULT;
        const limitTime = moment().add(limit, 'minutes');
        if (limitTime.unix() > moment(`${performance.attributes.day} ${performance.attributes.time_start}`).unix()) {
            throw ErrorUtilModule.ERROR_ACCESS;
        }

        let purchaseModel = new PurchaseSession.PurchaseModel(req.session.purchase);
        if (purchaseModel.transactionMP !== null && purchaseModel.reserveSeats !== null) {
            //重複確認へ
            res.json({ redirect: `/purchase/${req.body.id}/overlap`, err: null });

            return;
        }
        purchaseModel = new PurchaseSession.PurchaseModel({});
        // 取引開始
        const valid = (process.env.VIEW_TYPE === 'fixed') ? VALID_TIME_FIXED : VALID_TIME_DEFAULT;
        purchaseModel.expired = moment().add(valid, 'minutes').unix();
        purchaseModel.transactionMP = await MP.services.transaction.transactionStart({
            accessToken: await UtilModule.getAccessToken(req),
            expires_at: purchaseModel.expired
        });
        log('MP取引開始', purchaseModel.transactionMP.attributes.owners);
        delete req.session.purchase;
        delete req.session.mvtk;
        delete req.session.complete;
        //セッション更新
        req.session.purchase = purchaseModel.toSession();
        //座席選択へ
        res.json({ redirect: `/purchase/seat/${req.body.id}/`, contents: null });
    } catch (err) {
        if (err === ErrorUtilModule.ERROR_ACCESS
            || err === ErrorUtilModule.ERROR_PROPERTY) {
            res.json({ redirect: null, contents: 'access-error' });

            return;
        }
        res.json({ redirect: null, contents: 'access-congestion' });
    }
}

/**
 * ログイン
 * @function login
 * @param {string} sessionID
 * @param {string | undefined} username
 * @param {string | undefined} password
 */
async function login(sessionID: string, username?: string, password?: string) {
    const oauthTokenArgs: MP.services.oauth.IOauthTokenArgs = (username !== undefined && password !== undefined)
        ? {
            grant_type: MP.services.oauth.GrantType.password,
            scopes: ['admin'],
            client_id: 'motionpicture',
            state: sessionID,
            username: username,
            password: password
        }
        : {
            grant_type: MP.services.oauth.GrantType.clientCredentials,
            scopes: ['admin'],
            client_id: 'motionpicture',
            state: sessionID
        };

    const oauthToken = await MP.services.oauth.oauthToken(oauthTokenArgs);

    return {
        accessToken: oauthToken.access_token,
        tokenType: oauthToken.token_type,
        expires: moment().add(Number(oauthToken.expires_in), 'second').unix(),
        grantType: oauthTokenArgs.grant_type
    };
}
