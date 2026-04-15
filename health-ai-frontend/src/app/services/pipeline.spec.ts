import { TestBed } from '@angular/core/testing';

import { Pipeline } from './pipeline';

describe('Pipeline', () => {
  let service: Pipeline;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Pipeline);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
