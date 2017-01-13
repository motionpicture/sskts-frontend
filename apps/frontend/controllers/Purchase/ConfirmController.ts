import PurchaseController from './PurchaseController';


export default class ConfirmController extends PurchaseController {
    /**
     * 購入者内容確認
     */
    public index(): void {
        if (!this.req.session) return this.next(new Error('session is undefined'));
        if (this.req.session['purchaseInfo']
            && this.req.session['performance']
            && this.req.session['reserveSeats']
            && this.req.session['reserveTickets']
            && this.req.session['updateReserve']) {
            //購入者内容確認表示
            this.res.locals['gmoTokenObject'] = (this.req.session['gmoTokenObject']) ? this.req.session['gmoTokenObject'] : null;
            this.res.locals['info'] = this.req.session['purchaseInfo'];
            this.res.locals['performance'] = this.req.session['performance'];
            this.res.locals['reserveSeats'] = this.req.session['reserveSeats'];
            this.res.locals['reserveTickets'] = this.req.session['reserveTickets'];
            this.res.locals['updateReserve'] = this.req.session['updateReserve'];
            this.res.locals['step'] = 3;
            this.res.locals['price'] = this.getPrice(this.req.session);
            this.res.render('purchase/confirm');
        } else {
            return this.next(new Error('無効なアクセスです'));
        }

    }

    /**
     * 購入確定
     */
    public purchase(): void {
        if (!this.req.session) return this.next(new Error('session is undefined'));
        //モーションAPI仮購入
        // let toBeExpiredAt = this.req.params.toBeExpiredAt;
        // let isSecurityCodeSet = this.req.params.isSecurityCodeSet;

        this.deleteSession();

        this.logger.debug('照会情報取得');
        //TODO スクリーンコード未追加
        this.req.session['inquiry'] = { 
            status: 0,
            message: '',
            list_reserve_seat:
            [ { seat_num: 'Ｊ－７' },
                { seat_num: 'Ｊ－８' },
                { seat_num: 'Ｊ－９' },
                { seat_num: 'Ｊ－１０' } ],
            title_branch_num: '0',
            title_code: '8570',
            list_ticket:
            [ { ticket_count: 2,
                ticket_name: '一般',
                ticket_price: 1800,
                ticket_code: '10' },
                { ticket_count: 1,
                ticket_name: '大･高生',
                ticket_price: 1500,
                ticket_code: '30' },
                { ticket_code: '80',
                ticket_price: 1000,
                ticket_count: 1,
                ticket_name: 'シニア' } ],
            time_begin: '2130',
            date_jouei: '20161215' 
        };

        let purchaseNo = '1234567889';

        this.logger.debug('購入確定', purchaseNo);
        //購入完了情報を返す
        this.res.json({
            purchaseNo: purchaseNo
        });
        

    }

    private getPrice(session: Express.Session): number {
        let reserveSeats = session['reserveSeats'];
        let reserveTickets = session['reserveTickets'];
        let price = 0;
        for (let seat of reserveSeats.list_tmp_reserve) {
            let ticket = reserveTickets[seat['seat_num']];
            price += ticket.sale_price;
        }
        return price;
    }


}
