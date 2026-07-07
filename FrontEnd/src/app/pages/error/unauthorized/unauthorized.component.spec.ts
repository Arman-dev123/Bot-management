import { TestBed, ComponentFixture } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { UnauthorizedComponent } from './unauthorized.component';

describe('UnauthorizedComponent', () => {
  let fixture: ComponentFixture<UnauthorizedComponent>;
  let component: UnauthorizedComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnauthorizedComponent, RouterTestingModule]
    }).compileComponents();
    fixture = TestBed.createComponent(UnauthorizedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());
  it('should render 403', () => {
    const el = fixture.nativeElement.querySelector('.error-code');
    expect(el?.textContent).toContain('403');
  });
});
