import * as express from 'express';

/**
 * 券種選択
 */
export default (req: express.Request): void => {
    req.checkBody(
        'reserveTickets',
        `${req.__('common.reserve_tickets')}${req.__('common.validation.required')}`
    ).notEmpty();
    req.checkBody(
        'reserveTickets',
        `${req.__('common.reserve_tickets')}${req.__('common.validation.is_json')}`
    ).isJSON();
};
