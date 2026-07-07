import { TestBed } from '@angular/core/testing';

import { DfoChat } from './dfo-chat';

describe('DfoChat', () => {
  let service: DfoChat;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DfoChat);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
