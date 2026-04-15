import { TestBed } from '@angular/core/testing';

import { Smartwatch } from './smartwatch';

describe('Smartwatch', () => {
  let service: Smartwatch;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Smartwatch);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
