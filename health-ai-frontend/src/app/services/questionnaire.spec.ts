import { TestBed } from '@angular/core/testing';

import { Questionnaire } from './questionnaire';

describe('Questionnaire', () => {
  let service: Questionnaire;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Questionnaire);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
