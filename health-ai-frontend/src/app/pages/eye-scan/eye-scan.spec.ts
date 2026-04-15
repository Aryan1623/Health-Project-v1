import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EyeScan } from './eye-scan';

describe('EyeScan', () => {
  let component: EyeScan;
  let fixture: ComponentFixture<EyeScan>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EyeScan],
    }).compileComponents();

    fixture = TestBed.createComponent(EyeScan);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
