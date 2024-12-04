import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConductorHomePage } from './conductor-home.page';

describe('ConductorHomePage', () => {
  let component: ConductorHomePage;
  let fixture: ComponentFixture<ConductorHomePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ConductorHomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
