import { TestBed } from '@angular/core/testing';

import { VscodeDataProviderService } from './vscode-data-provider.service';

describe('VscodeDataProviderService', () => {
  let service: VscodeDataProviderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VscodeDataProviderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
