import { TestBed, ComponentFixture } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach } from 'vitest';
import { MainLayoutComponent } from './main-layout.component';
import { AuthService } from '../../services/auth.service';
import { BotService } from '../../services/bot.service';

describe('MainLayoutComponent', () => {
  let fixture: ComponentFixture<MainLayoutComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainLayoutComponent, RouterTestingModule, NoopAnimationsModule],
      providers: [
        { provide: AuthService, useValue: { currentUser: signal({ userId: 'u1', name: 'A', email: 'a@a.com' }), logout: () => {} } },
        { provide: BotService, useValue: { getBots: () => of([]) } }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(MainLayoutComponent);
    fixture.detectChanges();
  });
  it('should create', () => expect(fixture.componentInstance).toBeTruthy());
});
