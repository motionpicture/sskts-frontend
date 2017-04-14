"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const minLength = 9;
/**
 * 購入者情報入力フォーム
 */
exports.default = (req) => {
    req.checkBody('theater_code', `${req.__('common.theater_code')}${req.__('common.validation.required')}`).notEmpty();
    req.checkBody('theater_code', `${req.__('common.theater_code')}${req.__('common.validation.is_number')}`).matches(/^[0-9]+$/);
    req.checkBody('reserve_num', `${req.__('common.purchase_number')}${req.__('common.validation.required')}`).notEmpty();
    req.checkBody('reserve_num', `${req.__('common.purchase_number')}${req.__('common.validation.is_number')}`).matches(/^[0-9]+$/);
    req.checkBody('tel_num', `${req.__('common.tel_num')}${req.__('common.validation.required')}`).notEmpty();
    req.checkBody('tel_num', `${req.__('common.tel_num')}${req.__('common.validation.is_number')}`).matches(/^[0-9]+$/);
    req.checkBody('tel_num', `${req.__('common.tel_num')}${req.__('common.validation.minlength %s', String(minLength))}`).isLength({
        min: minLength
    });
};
