import express = require('express');
import InquirySession = require('../../models/Inquiry/InquiryModel');
import LoginForm from '../../forms/Inquiry/LoginForm';
import COA = require("@motionpicture/coa-service");
import MP = require('../../../../libs/MP');
import UtilModule from '../Util/UtilModule';

namespace InquiryModule {
    /**
     * 照会認証ページ表示
     */
    export function login(_req: express.Request, res: express.Response) {        
        res.locals['theater_code'] = '';
        res.locals['reserve_num'] = '';
        res.locals['tel_num'] = '';
        if (process.env.NODE_ENV === 'dev') {
            res.locals['theater_code'] = '001';
            res.locals['reserve_num'] = '11625';
            res.locals['tel_num'] = '09040007648';
        }
        res.locals['error'] = null;
        return res.render('inquiry/login');
    }

    /**
     * 照会認証
     */
    export function auth(req: express.Request, res: express.Response, next: express.NextFunction) {
        if (!req.session) return next(req.__('common.error.property'));
        let inquiryModel = new InquirySession.InquiryModel(req.session['inquiry']);
        let form = LoginForm(req);
        form(req, res, () => {
            if (!req.form) return next(req.__('common.error.property'));
            if (req.form.isValid) {
                getStateReserve(req, inquiryModel).then(()=>{
                    
                    //購入者内容確認へ
                    return res.redirect(`/inquiry/${inquiryModel.transactionId}/`);
                }, (err)=>{
                    return next(new Error(err.message));
                });

            } else {
                
                res.locals['error'] = req.form.getErrors();
                return res.render('inquiry/login');
            }
        });
    }

    /**
     * 照会情報取得
     */
    async function getStateReserve(req: express.Request, inquiryModel: InquirySession.InquiryModel): Promise<void> {
        inquiryModel.transactionId = await MP.makeInquiry.call({
            /** 施設コード */ 
            inquiry_theater: req.body.theater_code,   
            /** 座席チケット購入番号 */                 
            inquiry_id: req.body.reserve_num, 
            /** 電話番号 */
            inquiry_pass: req.body.tel_num, 
        });
        console.log('MP取引Id取得', inquiryModel.transactionId);

        inquiryModel.login = req.body;

        inquiryModel.stateReserve = await COA.stateReserveInterface.call({
            /** 施設コード */ 
            theater_code: req.body.theater_code,
            /** 座席チケット購入番号 */                   
            reserve_num: req.body.reserve_num, 
            /** 電話番号 */
            tel_num: req.body.tel_num, 
        });
        console.log('COA照会情報取得');

        let performanceId = UtilModule.getPerformanceId({
            theaterCode: req.body.theater_code, 
            day: inquiryModel.stateReserve.date_jouei, 
            titleCode: inquiryModel.stateReserve.title_code, 
            titleBranchNum: inquiryModel.stateReserve.title_branch_num,
            screenCode: inquiryModel.stateReserve.screen_code, 
            timeBegin: inquiryModel.stateReserve.time_begin
        });

        console.log('パフォーマンスID取得', performanceId);
        inquiryModel.performance = await MP.getPerformance.call({
            id: performanceId
        });
        console.log('MPパフォーマンス取得');

        if (!req.session) throw req.__('common.error.property');
        req.session['inquiry'] = inquiryModel.formatToSession(); 
        
    }

    /**
     * 照会確認ページ表示
     */
    export function index(req: express.Request, res: express.Response, next: express.NextFunction): void {
        if (!req.session) return next(req.__('common.error.property'));
        let inquiryModel = new InquirySession.InquiryModel(req.session['inquiry']);
        if (inquiryModel.stateReserve
        && inquiryModel.performance
        && inquiryModel.login
        && inquiryModel.transactionId) {
            res.locals['stateReserve'] = inquiryModel.stateReserve;
            res.locals['performance'] = inquiryModel.performance;
            res.locals['login'] = inquiryModel.login;
            res.locals['transactionId'] = inquiryModel.transactionId;
            
            return res.render('inquiry/index');
        } else {
            //照会認証ページへ
            return res.redirect('/inquiry/login?transaction_id=' + req.params.transactionId);
        }


    }
}

export default InquiryModule;

