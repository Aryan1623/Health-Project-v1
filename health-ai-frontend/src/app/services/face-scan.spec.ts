import { TestBed } from '@angular/core/testing';

import { FaceScan } from './face-scan';

describe('FaceScan', () => {
  let service: FaceScan;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FaceScan);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
