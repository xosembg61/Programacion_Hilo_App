import { Component, computed, signal } from '@angular/core';
import { EXERCISE_SOLUTIONS, ExerciseSolution } from './exercise-solutions';
import { ExerciseSourceFile, MULTI_FILE_SOLUTIONS } from './exercise-solution-files';
import { EXERCISE_SOLUTION_OVERRIDES } from './exercise-solution-overrides';
import { THEORY_CHAPTERS } from './theory';

type Level = 'Básico' | 'Medio' | 'Alto';
type LevelFilter = 'Todos' | Level;
type AppView = 'theory' | 'practice';

interface Exercise {
  id: number;
  title: string;
  level: Level;
  concept: string;
  duration: string;
  description: string;
  assignment: string;
  steps: string[];
  checks: string[];
  question: string;
}

const EXERCISES: Exercise[] = [
  {
    id: 1, title: 'Dos hilos que saludan', level: 'Básico', concept: 'Thread · start() y run()', duration: '15 min',
    description: 'Pon en marcha dos tareas independientes y observa cómo se intercala su salida.',
    assignment: 'Crea una aplicación de consola que lance dos hilos, A y B. Cada uno debe imprimir cinco saludos numerados del 1 al 5.',
    steps: ['Crea SaludoThread como subclase de Thread; recibe y guarda una etiqueta en el constructor.', 'Sobrescribe run() para imprimir los cinco mensajes de esa etiqueta.', 'En main, crea A y B y llama a start() en ambos, sin pausas ni datos compartidos.', 'Ejecuta tres veces. En una segunda versión, cambia start() por run().'],
    checks: ['Aparecen diez saludos y cada etiqueta conserva el orden 1–5.', 'Con start() el orden entre A y B puede variar; con run() una tarea termina antes de empezar la otra.'],
    question: '¿Por qué run() y start() no tienen el mismo efecto, aunque alguna ejecución muestre los mensajes en el mismo orden?'
  },
  {
    id: 2, title: 'Separar la tarea del hilo', level: 'Básico', concept: 'Runnable · composición', duration: '15 min',
    description: 'Define el trabajo de forma independiente y deja que Thread se encargue de ejecutarlo.',
    assignment: 'Repite los saludos del reto anterior con dos tareas Runnable distintas y un Thread para cada tarea.',
    steps: ['Crea TareaSaludo implementando Runnable, con atributo etiqueta, constructor y run().', 'En main, crea dos tareas diferentes, A y B.', 'Construye un Thread para cada tarea y arranca ambos con start().'],
    checks: ['Se imprimen diez mensajes y ambas numeraciones llegan hasta 5.', 'Cada objeto de tarea tiene su propia etiqueta y los mensajes pueden mezclarse.'],
    question: '¿Qué objeto contiene el trabajo y qué objeto permite ejecutarlo en otro hilo?'
  },
  {
    id: 3, title: 'Poner nombre y esperar', level: 'Básico', concept: 'setName() · isAlive() · join()', duration: '20 min',
    description: 'Identifica los hilos y haz que main espere a que el trabajo concurrente termine.',
    assignment: 'Lanza dos tareas que impriman veinte mensajes cada una y muestra cuándo están activas y cuándo han terminado.',
    steps: ['Asigna Trabajador1 y Trabajador2 con setName() y muestra ambos nombres desde main.', 'Consulta isAlive() antes de arrancar, justo después de start() y después de join().', 'Arranca los dos hilos antes de esperar a cada uno con join().', 'Al terminar ambas esperas, imprime «Todos han terminado».'],
    checks: ['isAlive() es false antes del arranque y después de join(); tras start() puede variar.', 'El mensaje final aparece después de los cuarenta mensajes.'],
    question: '¿Qué cambiaría si esperaras al primer hilo antes de arrancar el segundo?'
  },
  {
    id: 4, title: 'Dos ritmos distintos', level: 'Básico', concept: 'currentThread() · sleep()', duration: '20 min',
    description: 'Compara dos tareas que avanzan a velocidades diferentes sin imponer una alternancia.',
    assignment: 'Crea dos tareas de cinco mensajes: una espera 200 ms y la otra 400 ms entre mensajes.',
    steps: ['Nombra los hilos y consulta el nombre actual con Thread.currentThread().getName().', 'Usa Thread.sleep(...) entre mensajes dentro de un bloque try/catch.', 'Si se interrumpe el sueño, termina run() con return.', 'Arranca ambos hilos y espera con join().'],
    checks: ['Aparecen diez mensajes con el nombre del hilo que los imprime.', 'Las pausas son aproximadas: no se garantiza alternancia ni precisión exacta.'],
    question: '¿Thread.sleep(...) detiene todo el programa o solo el hilo que hace la llamada?'
  },
  {
    id: 5, title: 'Cuatro hilos y un contador', level: 'Básico', concept: 'Recurso compartido · condición de carrera', duration: '25 min',
    description: 'Provoca una actualización concurrente no protegida y examina el resultado.',
    assignment: 'Cuatro tareas deben incrementar el mismo contador 100 000 veces cada una, sin sincronización.',
    steps: ['Implementa Contador con valor inicial cero y un método incrementar() que ejecute valor++.', 'Crea un solo Contador y pásalo a las cuatro tareas.', 'Haz que cada tarea incremente 100 000 veces; no imprimas dentro del bucle.', 'Espera a todos los hilos y repite diez ejecuciones anotando el total.'],
    checks: ['El máximo esperado es 400 000.', 'Un resultado menor puede ocurrir; obtener 400 000 en algunas pruebas no demuestra que sea seguro.'],
    question: '¿Cómo pueden perderse incrementos si dos hilos leen el mismo valor antes de escribir el siguiente?'
  },
  {
    id: 6, title: 'Actualizar el contador sin pérdidas', level: 'Básico', concept: 'synchronized · monitor', duration: '25 min',
    description: 'Protege el acceso al estado compartido usando el mismo monitor para todas las tareas.',
    assignment: 'Corrige el contador anterior con un método sincronizado y después con un bloque synchronized.',
    steps: ['Haz privado valor y convierte incrementar() en synchronized.', 'Añade un método de consulta y úsalo después de esperar con join() a los cuatro hilos.', 'En otra versión, elimina synchronized del método y protege valor++ con synchronized sobre el mismo Contador.', 'Repite diez veces ambas versiones.'],
    checks: ['Las dos versiones terminan siempre en 400 000.', 'Todas las tareas comparten el mismo Contador y el mismo cerrojo.'],
    question: '¿Por qué no sirve que cada tarea use un objeto distinto como cerrojo?'
  },
  {
    id: 7, title: 'Pedir a un hilo que termine', level: 'Básico', concept: 'interrupt() · cancelación cooperativa', duration: '20 min',
    description: 'Solicita la parada de un trabajador y haz que este coopere con la interrupción.',
    assignment: 'Un trabajador imprime un mensaje cada 200 ms. Main le pide que termine después de aproximadamente un segundo.',
    steps: ['Mantén el bucle mientras el hilo actual no esté interrumpido.', 'Arranca el trabajador; espera alrededor de 1 000 ms y llama a interrupt().', 'Si sleep() lanza InterruptedException, restaura la marca con Thread.currentThread().interrupt() y termina run().', 'Haz join() y muestra «Trabajador terminado».'],
    checks: ['El trabajador deja de imprimir y el programa termina.', 'No exijas un número fijo de mensajes: depende del momento de la interrupción.'],
    question: '¿Por qué el trabajador tiene que consultar la petición o atender la excepción para terminar?'
  },
  {
    id: 8, title: 'Esperar a que se abra una puerta', level: 'Básico', concept: 'wait() · condición protegida', duration: '25 min',
    description: 'Usa un monitor para esperar a que cambie una condición compartida.',
    assignment: 'Un hilo quiere pasar por una Puerta inicialmente cerrada y otro la abre después de 600 ms.',
    steps: ['Protege todas las consultas y cambios de abierta con la misma puerta como monitor.', 'El hilo que espera usa while (!abierta) y puerta.wait(200) dentro de synchronized.', 'El hilo que abre duerme fuera del monitor y luego cambia abierta a true dentro de synchronized.', 'Espera a ambos con join(); ante InterruptedException, restaura la marca y termina.'],
    checks: ['Solo aparece «Paso permitido» cuando abierta es true.', 'wait(200) libera el monitor mientras espera; al volver, se comprueba de nuevo la condición.'],
    question: '¿Por qué el hilo que abre puede adquirir el monitor mientras el otro está dentro de wait()?'
  },
  {
    id: 9, title: 'Avisar cuando se abra la puerta', level: 'Básico', concept: 'wait() · notify()', duration: '25 min',
    description: 'Sustituye la espera periódica por una notificación asociada al cambio de estado.',
    assignment: 'Adapta la puerta para que el hilo que abre avise al único hilo que espera pasar.',
    steps: ['Usa wait() sin tiempo de espera, conservando el while que comprueba abierta.', 'Cambia abierta a true y llama a notify() sobre la misma puerta dentro del mismo synchronized.', 'Prueba arrancando ambos hilos a la vez.', 'Repite abriendo la puerta primero, espera con join() y arranca después al que quiere pasar.'],
    checks: ['En ambas pruebas aparece «Paso permitido» y todos terminan.', 'Si la puerta ya está abierta, el receptor no espera una notificación que ya ocurrió.'],
    question: '¿Por qué hay que conservar el estado abierta aunque se utilice notify()?'
  },
  {
    id: 10, title: 'Avisar a todos los que esperan', level: 'Básico', concept: 'notifyAll() · varios receptores', duration: '25 min',
    description: 'Despierta a todos los participantes que comparten una misma condición.',
    assignment: 'Haz que cinco hilos esperen a que se abra una puerta compartida y que todos puedan pasar.',
    steps: ['Cada hilo espera con while y wait() usando el monitor de la misma puerta.', 'El hilo que abre cambia abierta a true y llama a notifyAll() dentro de synchronized.', 'Imprime el nombre de cada hilo al pasar y espera a todos con join().', 'Repite abriendo antes de arrancar los cinco hilos.'],
    checks: ['Los cinco pasan una vez y terminan.', 'El orden de paso puede variar; también funciona si la puerta ya estaba abierta.'],
    question: '¿Por qué una llamada a notify() no garantiza que terminen los cinco hilos?'
  },
  {
    id: 11, title: 'Vender entradas sin repetir números', level: 'Medio', concept: 'Inventario compartido · operación atómica', duration: '30 min',
    description: 'Reparte un inventario entre vendedores concurrentes sin vender dos veces la misma entrada.',
    assignment: 'Tres vendedores compiten por vender veinte entradas numeradas del 1 al 20.',
    steps: ['Implementa InventarioEntradas.vender(): devuelve una entrada disponible o -1 si no queda ninguna.', 'Comprueba y actualiza las existencias en una única sección sincronizada.', 'Cada vendedor guarda sus ventas en una lista propia y continúa hasta recibir -1.', 'Tras join(), muestra las ventas de cada hilo y el total; prueba también con cero y una entrada.'],
    checks: ['Se venden exactamente los números del 1 al 20, sin repetidos.', 'No es necesario que los vendedores reciban la misma cantidad.'],
    question: '¿Qué error aparecería si comprobar existencias y descontar fueran operaciones separadas?'
  },
  {
    id: 12, title: 'Enviar datos mediante un buzón', level: 'Medio', concept: 'Productor-consumidor · wait/notifyAll', duration: '35 min',
    description: 'Coordina productor y consumidor con un buzón que solo admite un dato pendiente.',
    assignment: 'Un productor envía los números del 1 al 10 y un consumidor los recoge en orden.',
    steps: ['Implementa poner(int) y recoger() con el mismo monitor protegiendo dato y estado.', 'El productor espera mientras está lleno; el consumidor espera mientras está vacío. Usa while.', 'Después de depositar o retirar un dato, llama a notifyAll().', 'Prueba el flujo normal con join() y pausas fuera del monitor; luego prueba la interrupción de ambos.'],
    checks: ['En la prueba normal se reciben los números del 1 al 10 en orden.', 'En la cancelación pueden recibirse menos, pero ambos hilos terminan.'],
    question: '¿Por qué hay que volver a comprobar lleno o vacío después de despertar?'
  },
  {
    id: 13, title: 'Dar la salida a cuatro corredores', level: 'Medio', concept: 'Señal compartida · Runnable · Thread', duration: '35 min',
    description: 'Mantén cuatro tareas bloqueadas hasta que un árbitro dé una señal común.',
    assignment: 'Cuatro corredores esperan la señal de un árbitro que cuenta de 3 a 1 y da la salida.',
    steps: ['Crea una señal compartida salidaDada, inicialmente false; los corredores esperan con while y wait().', 'El árbitro, una subclase de Thread, hace la cuenta atrás con pausas fuera del monitor.', 'Dentro de synchronized, muestra «Salida», activa salidaDada y llama a notifyAll().', 'Cada corredor imprime tres pasos; espera a todos con join() y prueba también con un corredor tardío.'],
    checks: ['Aparecen doce pasos y ninguno precede a «Salida».', 'El corredor que arranca después de la señal también termina.'],
    question: '¿Qué permite continuar al corredor que llega después de la notificación?'
  },
  {
    id: 14, title: 'Detener un servicio de encargos', level: 'Medio', concept: 'Cola compartida · interrupción segura', duration: '40 min',
    description: 'Procesa una cola FIFO y distingue los encargos terminados de los cancelados.',
    assignment: 'Un trabajador recoge cinco encargos. Main puede interrumpir el servicio mientras está trabajando.',
    steps: ['Implementa añadir() y extraer() sobre la misma cola y monitor; extraer espera con while y wait().', 'El trabajador retira un encargo y lo procesa durmiendo 300 ms fuera del monitor.', 'Main añade los encargos, espera unos 500 ms e interrumpe; atiende la interrupción al esperar, dormir y antes de retirar otro.', 'Después de join(), muestra completados, retirado pero cancelado y pendientes. Repite con cola vacía.'],
    checks: ['En la primera prueba cada identificador aparece una sola vez entre las tres listas.', 'En ambas pruebas el trabajador termina sin quedarse esperando.'],
    question: '¿Por qué un encargo retirado de la cola no cuenta automáticamente como completado?'
  },
  {
    id: 15, title: 'Imprimir por turnos', level: 'Medio', concept: 'Estado compartido · alternancia · cancelación', duration: '35 min',
    description: 'Construye una alternancia exacta entre dos hilos sin usar pausas para coordinar.',
    assignment: 'Dos hilos deben imprimir exactamente ABABABABAB, respetando un turno compartido.',
    steps: ['Inicializa turno en A; cada hilo espera con while y wait() cuando no le toca.', 'En una misma sección sincronizada, imprime, cambia el turno y llama a notifyAll().', 'Cada hilo imprime cinco veces. Añade cancelado y compruébalo antes de esperar y antes de imprimir.', 'Si hay interrupción, activa cancelado bajo el monitor, avisa a todos y espera a ambos con join().'],
    checks: ['La ejecución normal produce ABABABABAB.', 'Si se cancela, puede quedar un prefijo de la secuencia, pero ningún hilo queda esperando.'],
    question: '¿Por qué avisar al otro hilo no basta si solo comprueba a quién le toca?'
  },
  {
    id: 16, title: 'Gestionar un almacén compartido', level: 'Alto', concept: 'Productores-consumidores · capacidad limitada', duration: '50 min',
    description: 'Implementa un almacén acotado con varios productores y consumidores concurrentes.',
    assignment: 'Dos productores generan diez identificadores cada uno para un almacén de capacidad cinco; tres consumidores los retiran.',
    steps: ['Usa un único monitor: los productores esperan si está lleno y los consumidores si está vacío.', 'Mantén un contador de productores activos; cada productor lo reduce una vez, incluso si es interrumpido.', 'Cuando no haya datos ni productores activos, retirar() devuelve una señal de fin.', 'Registra la retirada dentro del monitor y simula el trabajo fuera. Prueba capacidad uno, consumidores lentos y cancelación.'],
    checks: ['Sin cancelar, se retiran veinte identificadores sin duplicados y la ocupación nunca supera la capacidad.', 'Al cancelar, los datos almacenados coinciden con los retirados más los que siguen dentro.'],
    question: '¿Por qué el último productor debe avisar aunque no haya añadido un dato nuevo?'
  },
  {
    id: 17, title: 'Transferir saldo entre cuentas', level: 'Alto', concept: 'Varios monitores · orden de bloqueo', duration: '50 min',
    description: 'Haz transferencias indivisibles entre cuentas y evita interbloqueos al adquirir sus bloqueos.',
    assignment: 'Tres hilos realizan 1 000 transferencias sobre tres cuentas con 1 000 unidades iniciales cada una.',
    steps: ['Comprueba saldo y actualiza origen y destino como una sola operación.', 'Adquiere los monitores de las dos cuentas siempre por identificador creciente.', 'Usa operaciones fijas o aleatorias con semilla fija; rechaza importes no positivos, saldo insuficiente y origen igual al destino.', 'Comprueba interrupciones entre transferencias, espera con join() y muestra balances y aceptadas/rechazadas.'],
    checks: ['Los saldos nunca son negativos y el total final es 3 000.', 'Prueba transferencias en sentidos opuestos y cancelación; una transferencia iniciada termina completa.'],
    question: '¿Cómo evita el orden de identificadores que dos hilos se esperen mutuamente?'
  },
  {
    id: 18, title: 'Esperar al grupo al final de cada fase', level: 'Alto', concept: 'Barrera reutilizable · generaciones', duration: '50 min',
    description: 'Sincroniza a un grupo de trabajadores entre fases mediante una barrera reutilizable.',
    assignment: 'Cuatro trabajadores realizan tres fases; nadie puede empezar la siguiente hasta que todos terminen la actual.',
    steps: ['Cada trabajador muestra inicio, simula trabajo fuera del monitor y muestra fin de fase.', 'La barrera protege con el mismo monitor un contador de llegadas y una generación.', 'El último reinicia el contador, avanza la generación y llama a notifyAll(); el resto espera con while.', 'Implementa cancelar() y haz que una interrupción durante el trabajo o la espera despierte y libere a todo el grupo.'],
    checks: ['Antes de iniciar la fase siguiente aparecen los cuatro mensajes de fin de la fase actual.', 'Al interrumpir a un trabajador, ninguno queda bloqueado en la barrera.'],
    question: '¿Qué problema evita el número de generación cuando un trabajador rápido llega a la siguiente reunión?'
  },
  {
    id: 19, title: 'Repartir tareas entre tres trabajadores', level: 'Alto', concept: 'Pool de hilos · cola acotada · cierre', duration: '55 min',
    description: 'Construye un pequeño pool de trabajadores que acepta, ejecuta y cancela tareas.',
    assignment: 'Tres trabajadores reutilizables comparten una cola de hasta cuatro tareas pendientes.',
    steps: ['Cada tarea tiene identificador y simula su ejecución fuera del monitor.', 'enviar() espera si la cola está llena; devuelve true al aceptar o false si el servicio está cerrado.', 'Los trabajadores esperan con la cola vacía, retiran tareas bajo el monitor y ejecutan fuera de él.', 'Implementa cerrar() para terminar lo aceptado y cancelarAhora() para registrar pendientes y pedir interrupción.'],
    checks: ['En cierre normal se completan doce tareas exactamente una vez.', 'Al cancelar, cada tarea aceptada queda registrada como completada, cancelada en ejecución o retirada de la cola.'],
    question: '¿Cómo decides si una tarea se acepta cuando enviar() y cerrar() ocurren casi al mismo tiempo?'
  },
  {
    id: 20, title: 'Reservar cámara y micrófono', level: 'Alto', concept: 'Recursos limitados · reserva y devolución', duration: '55 min',
    description: 'Reserva recursos incompatibles como una unidad y devuélvelos incluso si la tarea se cancela.',
    assignment: 'Cinco equipos comparten dos cámaras y tres micrófonos; cada equipo intenta realizar tres grabaciones.',
    steps: ['Implementa reservar() con while, wait() y un único monitor para ambos recuentos.', 'Descuenta cámara y micrófono juntos y solo entonces considera realizada la reserva.', 'Simula cada grabación fuera del monitor; regístrala como completada solo si sleep() termina normalmente.', 'Devuelve ambos recursos en finally solo si se reservaron, avisa con notifyAll() y prueba ejecución normal e interrupciones.'],
    checks: ['Sin cancelación se completan quince grabaciones.', 'Los recursos nunca son negativos ni superan sus máximos y todos están disponibles al final.'],
    question: '¿Por qué notifyAll() no garantiza que los equipos consigan recursos por orden de llegada?'
  }
];

@Component({
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  private readonly launchParams = new URLSearchParams(window.location.search);
  protected readonly isBrowserSession = this.launchParams.get('mode') === 'browser'
    && !!this.launchParams.get('session');
  protected readonly webClosing = signal(false);
  protected readonly webClosed = signal(false);
  protected readonly webCloseError = signal('');
  protected readonly exercises = EXERCISES;
  protected readonly theoryChapters = THEORY_CHAPTERS;
  protected readonly levels: LevelFilter[] = ['Todos', 'Básico', 'Medio', 'Alto'];
  protected readonly activeView = signal<AppView>('practice');
  protected readonly activeLevel = signal<LevelFilter>('Todos');
  protected readonly searchText = signal('');
  protected readonly selectedId = signal(1);
  protected readonly selectedChapterId = signal(1);
  protected readonly completedIds = signal<number[]>(this.readCompleted());
  protected readonly studiedChapterIds = signal<number[]>(this.readStudied());
  protected readonly visibleExercises = computed(() => {
    const level = this.activeLevel();
    const query = this.searchText().trim().toLocaleLowerCase('es');

    return this.exercises.filter((exercise) => {
      const matchesLevel = level === 'Todos' || exercise.level === level;
      const searchableText = `${exercise.title} ${exercise.concept} ${exercise.description} ${exercise.assignment}`.toLocaleLowerCase('es');
      return matchesLevel && (!query || searchableText.includes(query));
    });
  });
  protected readonly selectedExercise = computed(() => {
    const visible = this.visibleExercises();
    return visible.find((exercise) => exercise.id === this.selectedId()) ?? visible[0] ?? null;
  });
  protected readonly selectedChapter = computed(() =>
    this.theoryChapters.find((chapter) => chapter.id === this.selectedChapterId()) ?? this.theoryChapters[0]
  );
  protected readonly completedCount = computed(() => this.completedIds().length);
  protected readonly studiedCount = computed(() => this.studiedChapterIds().length);
  protected readonly progressPercent = computed(() => this.activeView() === 'practice'
    ? Math.round((this.completedCount() / this.exercises.length) * 100)
    : Math.round((this.studiedCount() / this.theoryChapters.length) * 100));
  protected readonly progressLabel = computed(() => this.activeView() === 'practice'
    ? `${this.completedCount()} / ${this.exercises.length} COMPLETADOS`
    : `${this.studiedCount()} / ${this.theoryChapters.length} CAPÍTULOS LEÍDOS`);

  protected async closeWebApp(): Promise<void> {
    if (!this.isBrowserSession || this.webClosing() || this.webClosed()) return;
    this.webClosing.set(true);
    this.webCloseError.set('');
    try {
      const token = this.launchParams.get('session')!;
      const response = await fetch(`/__stop?token=${encodeURIComponent(token)}`, { method: 'POST' });
      if (!response.ok) throw new Error('No se pudo detener la aplicación.');
      this.webClosed.set(true);
    } catch {
      this.webCloseError.set('No se pudo cerrar la aplicación. Vuelve a intentarlo.');
    } finally {
      this.webClosing.set(false);
    }
  }

  protected setView(view: AppView): void {
    this.activeView.set(view);
  }

  protected selectChapter(id: number): void {
    this.selectedChapterId.set(id);
  }

  protected isChapterStudied(id: number): boolean {
    return this.studiedChapterIds().includes(id);
  }

  protected toggleChapterStudied(id: number): void {
    const next = this.isChapterStudied(id)
      ? this.studiedChapterIds().filter((chapterId) => chapterId !== id)
      : [...this.studiedChapterIds(), id].sort((first, second) => first - second);
    this.studiedChapterIds.set(next);

    try {
      window.localStorage.setItem('multihilo-theory-read', JSON.stringify(next));
    } catch {}
  }

  protected moveChapter(direction: -1 | 1): void {
    const currentIndex = this.theoryChapters.findIndex((chapter) => chapter.id === this.selectedChapterId());
    const nextIndex = Math.max(0, Math.min(this.theoryChapters.length - 1, currentIndex + direction));
    this.selectChapter(this.theoryChapters[nextIndex].id);
  }

  protected selectLevel(level: LevelFilter): void {
    this.activeLevel.set(level);
    this.selectedId.set(this.visibleExercises()[0]?.id ?? 0);
  }

  protected selectExercise(id: number): void {
    this.selectedId.set(id);
  }

  protected updateSearch(value: string): void {
    this.searchText.set(value);
  }

  protected isCompleted(id: number): boolean {
    return this.completedIds().includes(id);
  }

  protected countForLevel(level: Level): number {
    return this.exercises.filter((exercise) => exercise.level === level).length;
  }

  protected solutionFor(exerciseId: number): ExerciseSolution {
    return EXERCISE_SOLUTIONS[exerciseId];
  }

  protected solutionExplanation(exerciseId: number): string {
    return EXERCISE_SOLUTION_OVERRIDES[exerciseId]?.explanation ?? this.solutionFor(exerciseId).explanation;
  }

  protected solutionFiles(exerciseId: number): ExerciseSourceFile[] {
    const override = EXERCISE_SOLUTION_OVERRIDES[exerciseId];
    if (override) return override.files;
    const files = MULTI_FILE_SOLUTIONS[exerciseId];
    if (files) return files;
    const solution = this.solutionFor(exerciseId);
    return [{ filename: solution.filename, code: solution.code }];
  }

  protected toggleCompleted(id: number): void {
    const next = this.isCompleted(id)
      ? this.completedIds().filter((completedId) => completedId !== id)
      : [...this.completedIds(), id].sort((first, second) => first - second);
    this.completedIds.set(next);

    try {
      window.localStorage.setItem('multihilo-completed', JSON.stringify(next));
    } catch {}
  }

  protected moveSelection(direction: -1 | 1): void {
    const visible = this.visibleExercises();
    const currentIndex = visible.findIndex((exercise) => exercise.id === this.selectedExercise()?.id);
    const nextIndex = Math.max(0, Math.min(visible.length - 1, currentIndex + direction));
    const nextExercise = visible[nextIndex];
    if (nextExercise) this.selectedId.set(nextExercise.id);
  }

  private readCompleted(): number[] {
    try {
      const stored = window.localStorage.getItem('multihilo-completed');
      const parsed: unknown = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed)
        ? parsed.filter((id): id is number => Number.isInteger(id) && id >= 1 && id <= EXERCISES.length)
        : [];
    } catch {
      return [];
    }
  }

  private readStudied(): number[] {
    try {
      const stored = window.localStorage.getItem('multihilo-theory-read');
      const parsed: unknown = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed)
        ? parsed.filter((id): id is number => Number.isInteger(id) && id >= 1 && id <= THEORY_CHAPTERS.length)
        : [];
    } catch {
      return [];
    }
  }
}
