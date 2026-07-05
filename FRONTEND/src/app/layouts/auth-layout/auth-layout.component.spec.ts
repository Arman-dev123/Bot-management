import { TestBed, ComponentFixture } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { AuthLayoutComponent } from './auth-layout.component';

describe('AuthLayoutComponent', () => {
  let fixture: ComponentFixture<AuthLayoutComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthLayoutComponent, RouterTestingModule]
    }).compileComponents();
    fixture = TestBed.createComponent(AuthLayoutComponent);
    fixture.detectChanges();
  });
  it('should create', () => expect(fixture.componentInstance).toBeTruthy());
});
