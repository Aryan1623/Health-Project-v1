import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FaceScanComponent } from './face-scan';

describe('FaceScanComponent', () => {
  let component: FaceScanComponent;
  let fixture: ComponentFixture<FaceScanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FaceScanComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FaceScanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the face scan component', () => {
    expect(component).toBeTruthy();
  });
});
