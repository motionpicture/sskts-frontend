import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './components/app/app.component';
import { InquiryBaseComponent } from './components/inquiry/inquiry-base/inquiry-base.component';
import { InquiryConfirmComponent } from './components/inquiry/inquiry-confirm/inquiry-confirm.component';
import { InquiryLoginComponent } from './components/inquiry/inquiry-login/inquiry-login.component';
import { ButtonsComponent } from './components/parts/buttons/buttons.component';
import { FooterComponent } from './components/parts/footer/footer.component';
import { HeaderComponent } from './components/parts/header/header.component';
import { LoadingComponent } from './components/parts/loading/loading.component';
import { ModalComponent } from './components/parts/modal/modal.component';
import { PurchaseNotesComponent } from './components/parts/purchase-notes/purchase-notes.component';
import { PurchaseStepComponent } from './components/parts/purchase-step/purchase-step.component';
import { PurchaseTermsComponent } from './components/parts/purchase-terms/purchase-terms.component';
import { ScreenComponent } from './components/parts/screen/screen.component';
import { SiteSealComponent } from './components/parts/site-seal/site-seal.component';
import { PurchaseBaseComponent } from './components/purchase/purchase-base/purchase-base.component';
import { PurchaseCompleteComponent } from './components/purchase/purchase-complete/purchase-complete.component';
import { PurchaseConfirmComponent } from './components/purchase/purchase-confirm/purchase-confirm.component';
import { PurchaseInputComponent } from './components/purchase/purchase-input/purchase-input.component';
import { PurchaseMvtkConfirmComponent } from './components/purchase/purchase-mvtk-confirm/purchase-mvtk-confirm.component';
import { PurchaseMvtkInputComponent } from './components/purchase/purchase-mvtk-input/purchase-mvtk-input.component';
import { PurchaseScheduleComponent } from './components/purchase/purchase-schedule/purchase-schedule.component';
import { PurchaseSeatComponent } from './components/purchase/purchase-seat/purchase-seat.component';
import { PurchaseTicketComponent } from './components/purchase/purchase-ticket/purchase-ticket.component';
import { InquiryService } from './services/inquiry/inquiry.service';
import { PurchaseGuardService } from './services/purchase-guard/purchase-guard.service';
import { PurchaseService } from './services/purchase/purchase.service';

@NgModule({
  declarations: [
    AppComponent,
    PurchaseBaseComponent,
    PurchaseCompleteComponent,
    PurchaseScheduleComponent,
    PurchaseSeatComponent,
    PurchaseTicketComponent,
    PurchaseInputComponent,
    PurchaseConfirmComponent,
    PurchaseMvtkInputComponent,
    PurchaseMvtkConfirmComponent,
    InquiryBaseComponent,
    InquiryLoginComponent,
    InquiryConfirmComponent,
    ScreenComponent,
    HeaderComponent,
    FooterComponent,
    PurchaseStepComponent,
    LoadingComponent,
    SiteSealComponent,
    ModalComponent,
    ButtonsComponent,
    PurchaseNotesComponent,
    PurchaseTermsComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [
    PurchaseGuardService,
    PurchaseService,
    InquiryService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
