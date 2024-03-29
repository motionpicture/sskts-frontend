import { Component, Input, OnInit } from '@angular/core';
import * as sasaki from '@motionpicture/sskts-api-javascript-client';

type IIndividualScreeningEvent = sasaki.factory.event.individualScreeningEvent.IEventWithOffer;
interface IFilmOrder {
    id: string;
    films: IIndividualScreeningEvent[];
}

@Component({
    selector: 'app-purchase-film-order',
    templateUrl: './purchase-film-order.component.html',
    styleUrls: ['./purchase-film-order.component.scss']
})
export class PurchaseFilmOrderComponent implements OnInit {
    @Input() public data: IFilmOrder;
    public title: string;
    public duration: string;

    constructor() { }

    public ngOnInit() {
        this.title = this.data.films[0].name.ja;
        this.duration = this.data.films[0].workPerformed.duration;
    }

}
