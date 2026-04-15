import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionnaireComponent } from './questionnaire';

describe('Questionnaire', () => {
  let component: QuestionnaireComponent;
  let fixture: ComponentFixture<QuestionnaireComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuestionnaireComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(QuestionnaireComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
