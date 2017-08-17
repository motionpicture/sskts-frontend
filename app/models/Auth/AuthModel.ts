import * as ssktsApi from '@motionpicture/sskts-api';

/**
 * 認証セッション
 * @interface IAuthSession
 */
export interface IAuthSession {
    /**
     * クライアントID
     */
    clientId: string;
    /**
     * クライアント鍵
     */
    clientSecret: string;
    /**
     * 状態
     */
    state: string;
    /**
     * スコープ
     */
    scopes: string[];
}

/**
 * 認証モデル
 * @class AuthModel
 */
export class AuthModel {
    /**
     * クライアントID
     */
    public clientId: string;
    /**
     * クライアント鍵
     */
    public clientSecret: string;
    /**
     * 状態
     */
    public state: string;
    /**
     * スコープ
     */
    public scopes: string[];

    /**
     * @constructor
     * @param {any} session
     */
    constructor(session?: any) {
        if (session === undefined) {
            session = {};
        }
        this.clientId = (session.clientId !== undefined) ? session.clientId : process.env.TEST_CLIENT_ID;
        this.clientSecret = (session.clientSecret !== undefined) ? session.clientSecret : process.env.TEST_CLIENT_SECRET,
        this.state = (session.state !== undefined) ? session.state : 'teststate',
        this.scopes = (session.scopes !== undefined) ? session.scopes : [
            'https://sskts-api-development.azurewebsites.net/transactions',
            'https://sskts-api-development.azurewebsites.net/events.read-only',
            'https://sskts-api-development.azurewebsites.net/organizations.read-only',
            'https://sskts-api-development.azurewebsites.net/orders.read-only'
        ];
    }

    /**
     * 認証クラス作成
     * @memberof AuthModel
     * @method create
     * @returns {ssktsApi.auth.ClientCredentials}
     */
    public create(): ssktsApi.auth.ClientCredentials {
        return new ssktsApi.auth.ClientCredentials(
            this.clientId,
            this.clientSecret,
            this.state,
            this.scopes
        );
    }

    /**
     * セッションへ保存
     * @memberof AuthModel
     * @method save
     * @returns {Object}
     */
    public save(session: any): void {
        const authSession: IAuthSession = {
            clientId: this.clientId,
            clientSecret: this.clientSecret,
            state: this.state,
            scopes: this.scopes
        };
        session.auth = authSession;
    }
}
