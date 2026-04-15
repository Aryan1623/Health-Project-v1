import { TestBed } from '@angular/core/testing';

import { EyeScan } from './eye-scan';

describe('EyeScan', () => {
  let service: EyeScan;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EyeScan);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
