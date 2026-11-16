import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { afterEach, vi } from 'vitest';

describe('App', () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/');
    vi.unstubAllGlobals();
  });
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    })
      .compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the practical workshop and all exercises', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Laboratorio de hilos');
    expect(compiled.querySelectorAll('.exercise-row').length).toBe(20);
  });

  it('should switch between theory chapters and practical exercises', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = () => Array.from(compiled.querySelectorAll<HTMLButtonElement>('.mode-button'));

    buttons().find((button) => button.textContent?.includes('Teoría'))?.click();
    fixture.detectChanges();

    expect(compiled.querySelector('.theory-chapter-heading h2')?.textContent).toContain('Conceptos básicos');
    expect(compiled.querySelectorAll('.chapter-link').length).toBe(9);

    Array.from(compiled.querySelectorAll<HTMLButtonElement>('.chapter-link'))
      .find((button) => button.textContent?.includes('Coordinación avanzada'))
      ?.click();
    fixture.detectChanges();

    expect(compiled.querySelector('.theory-chapter-heading h2')?.textContent).toContain('Coordinación avanzada');
    expect(compiled.querySelector('.theory-code')).toBeTruthy();

    buttons().find((button) => button.textContent?.includes('Práctica'))?.click();
    fixture.detectChanges();

    expect(compiled.querySelectorAll('.exercise-row').length).toBe(20);
  });

  it('should show a matching Java solution for each exercise', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const expectedFiles = [
      ['SaludoThread.java', 'Main.java'],
      ['TareaSaludo.java', 'Main.java'],
      ['Trabajador.java', 'Main.java'],
      ['HilosRotos.java', 'Main.java'],
      ['Contador.java', 'Tareas.java', 'Main.java'],
      ['Contador.java', 'Tareas.java', 'Main.java'],
      ['Ejercicio07.java'], ['Ejercicio08.java'], ['Ejercicio09.java'],
      ['Puerta.java', 'Main.java'],
      ['InventarioEntradas.java', 'Vendedor.java', 'Main.java'],
      ['Buzon.java', 'Productor.java', 'Consumidor.java', 'Main.java'],
      ['Salida.java', 'Arbitro.java', 'Corredor.java', 'Main.java'],
      ['ColaEncargos.java', 'Trabajador.java', 'Main.java'],
      ['Turnos.java', 'Impresor.java', 'Main.java'],
      ['Almacen.java', 'Productor.java', 'Consumidor.java', 'Main.java'],
      ['Cuenta.java', 'Transferencias.java', 'Main.java'],
      ['Ejercicio18.java'],
      ['Servicio.java', 'Trabajador.java', 'Main.java'],
      ['Ejercicio20.java'],
    ];
    expect(compiled.querySelectorAll('.exercise-row').length).toBe(20);

    for (let index = 0; index < 20; index++) {
      compiled.querySelectorAll<HTMLButtonElement>('.exercise-row')[index].click();
      fixture.detectChanges();
      const displayedFiles = Array.from(compiled.querySelectorAll('.theory-code-caption'))
        .map((caption) => caption.textContent ?? '');
      expect(displayedFiles).toEqual(expectedFiles[index].map((filename) => `${filename}JAVA`));
    }

    compiled.querySelector('.solution-details summary')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(compiled.querySelector('.solution-details')?.hasAttribute('open')).toBe(true);
  });

  it('should filter exercises by level', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const advancedFilter = Array.from(compiled.querySelectorAll<HTMLButtonElement>('.filter-tab'))
      .find((button) => button.textContent?.includes('Alto'));

    advancedFilter?.click();
    fixture.detectChanges();

    expect(compiled.querySelectorAll('.exercise-row').length).toBe(5);
  });

  it('should hide the close button in native mode and ordinary web hosting', async () => {
    for (const query of ['', '?session=test&mode=native', '?mode=browser']) {
      window.history.replaceState(null, '', '/' + query);
      const fixture = TestBed.createComponent(App);
      await fixture.whenStable();
      expect(fixture.nativeElement.querySelector('.web-close-button')).toBeNull();
      fixture.destroy();
    }
  });

  it('should stop the browser session and show a closed page', async () => {
    window.history.replaceState(null, '', '/?session=test-token&mode=browser');
    const stop = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', stop);
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    fixture.nativeElement.querySelector('.web-close-button').click();
    await fixture.whenStable();

    expect(stop).toHaveBeenCalledWith('/__stop?token=test-token', { method: 'POST' });
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain('Aplicación cerrada');
    expect(fixture.nativeElement.querySelector('.app-shell')).toBeNull();
  });

  it('should allow retrying when the server rejects a close request', async () => {
    window.history.replaceState(null, '', '/?session=test-token&mode=browser');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    fixture.nativeElement.querySelector('.web-close-button').click();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain('Vuelve a intentarlo');
    expect(fixture.nativeElement.querySelector('.web-close-button').disabled).toBe(false);
    expect(fixture.nativeElement.querySelector('.app-shell')).toBeTruthy();
  });
});
