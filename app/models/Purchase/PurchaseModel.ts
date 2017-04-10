/**
 * 購入セッション
 */
import * as COA from '@motionpicture/coa-service';
import * as GMO from '@motionpicture/gmo-service';
import * as moment from 'moment';
import * as MP from '../../../libs/MP';
import * as UtilModule from '../../modules/Util/UtilModule';
/**
 * 購入者情報
 * @interface IInput
 */
export interface IInput {
    /**
     * せい
     */
    last_name_hira: string;
    /**
     * めい
     */
    first_name_hira: string;
    /**
     * メールアドレス
     */
    mail_addr: string;
    /**
     * メールアドレス確認
     */
    mail_confirm: string;
    /**
     * 電話番号
     */
    tel_num: string;
    /**
     * 利用規約
     */
    agree: string;

}

/**
 * GMO
 * @interface IGMO
 */
export interface IGMO {
    /**
     * トークン
     */
    token: string;
}

/**
 * ムビチケ情報
 * @interface IMvtk
 */
export interface IMvtk {
    /**
     * 購入管理番号
     */
    code: string;
    /**
     * 暗証番号
     */
    password: string;
    /**
     * 有効券情報
     */
    ykknInfo: IValidTickettResult;
    /**
     * チケット情報
     */
    ticket: COA.MasterService.IMvtkTicketcodeResult;
}

/**
 * 有効券情報
 * @interface IValidTickettResult
 */
export interface IValidTickettResult {
    /**
     * 有効券種区分
     */
    ykknshTyp: string;
    /**
     * 映写方式区分
     */
    eishhshkTyp: string;
    /**
     * 有効期限券種別枚数
     */
    ykknKnshbtsmiNum: string;
    /**
     * 鑑賞券販売単価
     */
    knshknhmbiUnip: string;
    /**
     * 計上単価
     */
    kijUnip: string;
}

/**
 * 購入セッション
 * @class PurchaseModel
 */
export class PurchaseModel {
    public static SEAT_STATE: number = 0;
    public static TICKET_STATE: number = 1;
    public static INPUT_STATE: number = 2;
    public static CONFIRM_STATE: number = 3;
    public static COMPLETE_STATE: number = 4;

    /**
     * パフォーマンス
     */
    public performance: MP.IPerformance | null;
    /**
     * 劇場
     */
    public theater: MP.ITheater | null;
    /**
     * COA仮予約
     */
    public reserveSeats: COA.ReserveService.IUpdTmpReserveSeatResult | null;
    /**
     * 予約チケット
     */
    public reserveTickets: MP.IReserveTicket[] | null;
    /**
     * 入力情報
     */
    public input: IInput | null;
    /**
     * GMO TOKEN情報
     */
    public gmo: IGMO | null;
    /**
     * COA本予約
     */
    public updateReserve: COA.ReserveService.IUpdReserveResult | null;
    /**
     * 取引MP
     */
    public transactionMP: MP.ITransactionStartResult | null;
    /**
     * 取引GMO
     */
    public transactionGMO: GMO.CreditService.EntryTranResult | null;
    /**
     * COAオーソリ
     */
    public authorizationCOA: MP.IAddCOAAuthorizationResult | null;
    /**
     * GMOオーソリ
     */
    public authorizationGMO: MP.IAddGMOAuthorizationResult | null;
    /**
     * GMOオーソリ回数
     */
    public authorizationCountGMO: number;
    /**
     * オーダーID
     */
    public orderId: string | null;
    /**
     * 有効期限
     */
    public expired: number;
    /**
     * ムビチケ
     */
    public mvtk: IMvtk[] | null;
    /**
     * CAO情報
     */
    public performanceCOA: MP.IPerformanceCOA | null;
    /**
     * COA販売可能チケット情報
     */
    public salesTicketsCOA: COA.ReserveService.ISalesTicketResult[] | null;
    /**
     * 完了メールID
     */
    public completeMailId: string | null;

    /**
     * @constructor
     * @param {any} session
     */
    constructor(session: any) {
        if (session === undefined) {
            session = {};
        }

        this.performance = (session.performance !== undefined) ? session.performance : null;
        this.theater = (session.theater !== undefined) ? session.theater : null;
        this.reserveSeats = (session.reserveSeats !== undefined) ? session.reserveSeats : null;
        this.reserveTickets = (session.reserveTickets !== undefined) ? session.reserveTickets : null;
        this.input = (session.input !== undefined) ? session.input : null;
        this.gmo = (session.gmo !== undefined) ? session.gmo : null;
        this.updateReserve = (session.updateReserve !== undefined) ? session.updateReserve : null;
        this.transactionMP = (session.transactionMP !== undefined) ? session.transactionMP : null;
        this.transactionGMO = (session.transactionGMO !== undefined) ? session.transactionGMO : null;
        this.authorizationCOA = (session.authorizationCOA !== undefined) ? session.authorizationCOA : null;
        this.authorizationGMO = (session.authorizationGMO !== undefined) ? session.authorizationGMO : null;
        this.authorizationCountGMO = (session.authorizationCountGMO !== undefined) ? session.authorizationCountGMO : 0;
        this.orderId = (session.orderId !== undefined) ? session.orderId : null;
        this.expired = (session.expired !== undefined) ? session.expired : null;
        this.mvtk = (session.mvtk !== undefined) ? session.mvtk : null;
        this.performanceCOA = (session.performanceCOA !== undefined) ? session.performanceCOA : null;
        this.salesTicketsCOA = (session.salesTicketsCOA !== undefined) ? session.salesTicketsCOA : null;
        this.completeMailId = (session.completeMailId !== undefined) ? session.completeMailId : null;
    }

    /**
     * セッションObjectへ変換
     * @memberOf PurchaseModel
     * @method toSession
     * @returns {Object} result
     */
    public toSession(): {
        performance: MP.IPerformance | null;
        theater: MP.ITheater | null;
        reserveSeats: COA.ReserveService.IUpdTmpReserveSeatResult | null;
        reserveTickets: MP.IReserveTicket[] | null;
        input: IInput | null;
        gmo: IGMO | null;
        updateReserve: COA.ReserveService.IUpdReserveResult | null;
        transactionMP: MP.ITransactionStartResult | null;
        transactionGMO: GMO.CreditService.EntryTranResult | null;
        authorizationCOA: MP.IAddCOAAuthorizationResult | null;
        authorizationGMO: MP.IAddGMOAuthorizationResult | null;
        authorizationCountGMO: number;
        orderId: string | null;
        expired: number;
        mvtk: IMvtk[] | null;
        performanceCOA: MP.IPerformanceCOA | null;
        salesTicketsCOA: COA.ReserveService.ISalesTicketResult[] | null
        completeMailId: string | null
    } {
        return {
            performance: this.performance,
            theater: this.theater,
            reserveSeats: this.reserveSeats,
            reserveTickets: this.reserveTickets,
            input: this.input,
            gmo: this.gmo,
            updateReserve: this.updateReserve,
            transactionMP: this.transactionMP,
            transactionGMO: this.transactionGMO,
            authorizationCOA: this.authorizationCOA,
            authorizationGMO: this.authorizationGMO,
            authorizationCountGMO: this.authorizationCountGMO,
            orderId: this.orderId,
            expired: this.expired,
            mvtk: this.mvtk,
            performanceCOA: this.performanceCOA,
            salesTicketsCOA: this.salesTicketsCOA,
            completeMailId: this.completeMailId
        };
    }

    /**
     * ステータス確認
     * @memberOf PurchaseModel
     * @method accessAuth
     * @param {number} value
     * @returns {boolean}
     */
    public accessAuth(value: number): boolean {
        let result = true;
        if (this.transactionMP === null) result = false;
        switch (value) {
            case PurchaseModel.SEAT_STATE:
                break;
            case PurchaseModel.TICKET_STATE:
                if (this.reserveSeats === null) result = false;
                break;
            case PurchaseModel.INPUT_STATE:
                if (this.reserveSeats === null) result = false;
                if (this.reserveTickets === null) result = false;
                break;
            case PurchaseModel.CONFIRM_STATE:
                if (this.reserveSeats === null) result = false;
                if (this.reserveTickets === null) result = false;
                if (this.input === null) result = false;
                break;
            case PurchaseModel.COMPLETE_STATE:
                break;
            default:
                break;
        }
        return result;
    }

    /**
     * 予約金額取得（決済する分）
     * @memberOf PurchaseModel
     * @method getReserveAmount
     * @returns {number}
     */
    public getReserveAmount(): number {
        const reserveTickets = this.reserveTickets;
        let amount = 0;
        if (reserveTickets === null) return amount;
        for (const ticket of reserveTickets) {
            amount += ticket.sale_price;
        }
        return amount;
    }

    /**
     * チケット価値取得（チケット価値）
     * @memberOf PurchaseModel
     * @method getPrice
     * @returns {number}
     */
    public getPrice(): number {
        return (this.getReserveAmount() + this.getMvtkPrice());
    }

    /**
     * ムビチケ計上単価合計取得
     * @memberOf PurchaseModel
     * @method getMvtkPrice
     * @returns {number}
     */
    public getMvtkPrice(): number {
        const reserveTickets = this.reserveTickets;
        let price = 0;
        if (reserveTickets === null) return price;
        for (const ticket of reserveTickets) {
            price += ticket.mvtk_app_price;
        }
        return price;
    }

    /**
     * 座席文言返却
     * @memberOf PurchaseModel
     * @method seatToString
     * @returns {string}
     */
    public seatToString(): string {
        if (this.reserveSeats === null) return '';
        const seats = [];
        for (const seat of this.reserveSeats.list_tmp_reserve) {
            seats.push(seat.seat_num);
        }
        return seats.join('、');
    }

    /**
     * 券種文言返却
     * @memberOf PurchaseModel
     * @method ticketToString
     * @returns {string}
     */
    public ticketToString(): string {
        if (this.reserveSeats === null) return '';
        if (this.reserveTickets === null) return '';
        const ticketObj = {};
        const tickets = [];
        for (const ticket of this.reserveTickets) {
            if ((<any>ticketObj)[ticket.ticket_code] !== undefined) {
                (<any>ticketObj)[ticket.ticket_code].length += 1;
            } else {
                (<any>ticketObj)[ticket.ticket_code] = {
                    name: ticket.ticket_name,
                    length: 1
                };
            }
        }
        for (const key of Object.keys(ticketObj)) {
            const ticket = (<any>ticketObj)[key];
            tickets.push(`${ticket.name} × ${ticket.length}`);
        }
        return tickets.join('、');
    }

    /**
     * GMOオーソリ回数取得
     * @memberOf PurchaseModel
     * @method authorizationCountGMOToString
     * @returns {string}
     */
    public authorizationCountGMOToString(): string {
        return `00${this.authorizationCountGMO}`.slice(UtilModule.DIGITS_02);
    }

    /**
     * 有効期限確認
     * @memberOf PurchaseModel
     * @method isExpired
     * @returns {boolean}
     */
    public isExpired(): boolean {
        return (this.expired < moment().unix());
    }
}