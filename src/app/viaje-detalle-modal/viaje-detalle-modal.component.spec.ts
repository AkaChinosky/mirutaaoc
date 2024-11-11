import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ViajeDetalleModalComponent } from './viaje-detalle-modal.component';

describe('ViajeDetalleModalComponent', () => {
  let component: ViajeDetalleModalComponent;
  let fixture: ComponentFixture<ViajeDetalleModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ViajeDetalleModalComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(ViajeDetalleModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
