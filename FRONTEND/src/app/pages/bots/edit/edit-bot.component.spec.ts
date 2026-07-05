
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EditBotComponent } from './edit-bot.component';
import { BotService } from '../../../services/bot.service';
import { NotificationService } from '../../../services/notification.service';

const mockBot = { id: 'b1', botName: 'TestBot', projectId: 'proj', languageCode: 'en', createdDate: '2024-01-01', updatedDate: '2024-01-01' };

describe('EditBotComponent', () => {
  let fixture: ComponentFixture<EditBotComponent>;
  let component: EditBotComponent;
  let botSpy: any;
  let notifSpy: any;

  beforeEach(async () => {
    botSpy = { getBot: vi.fn().mockReturnValue(of(mockBot)), updateBot: vi.fn() };
    notifSpy = { success: vi.fn(), error: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [EditBotComponent, RouterTestingModule, NoopAnimationsModule],
      providers: [
        { provide: BotService, useValue: botSpy },
        { provide: NotificationService, useValue: notifSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'b1' } } } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EditBotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should load bot and patch form', async () => {
    await fixture.whenStable();
    expect(component.form.get('botName')?.value).toBe('TestBot');
    expect(component.form.get('languageCode')?.value).toBe('en');
    expect(component.fetching()).toBe(false);
  });

  it('should not submit if form invalid', () => {
    component.form.get('botName')?.setValue('X');
    component.submit();
    expect(botSpy.updateBot).not.toHaveBeenCalled();
  });

  it('should update bot on valid submit', async () => {
    botSpy.updateBot.mockReturnValue(of(mockBot));
    component.form.setValue({ botName: 'NewName', languageCode: 'es' });
    component.submit();
    await fixture.whenStable();
    expect(botSpy.updateBot).toHaveBeenCalledWith('b1', { botName: 'NewName', languageCode: 'es' });
    expect(notifSpy.success).toHaveBeenCalled();
  });

  it('should show error on update failure', async () => {
    botSpy.updateBot.mockReturnValue(throwError(() => ({ error: { message: 'Update failed' } })));
    component.form.setValue({ botName: 'NewName', languageCode: 'en' });
    component.submit();
    await fixture.whenStable();
    expect(notifSpy.error).toHaveBeenCalledWith('Update failed');
    expect(component.loading()).toBe(false);
  });

  it('should navigate away if bot not found', async () => {
    botSpy.getBot.mockReturnValue(throwError(() => new Error('not found')));
    component.ngOnInit();
    await fixture.whenStable();
    expect(notifSpy.error).toHaveBeenCalled();
  });
});