export type TheoryBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'note'; title: string; text: string }
  | { type: 'code'; caption: string; code: string }
  | { type: 'table'; headers: string[]; rows: string[][] };

export interface TheorySection {
  title: string;
  blocks: TheoryBlock[];
}

export interface TheoryChapter {
  id: number;
  title: string;
  summary: string;
  sections: TheorySection[];
}

export const THEORY_CHAPTERS: TheoryChapter[] = [
  {
    id: 1,
    title: 'Conceptos básicos',
    summary: 'Procesos, hilos, memoria compartida y motivos para trabajar con varios flujos de ejecución.',
    sections: [
      {
        title: 'Programa y flujos de ejecución',
        blocks: [
          { type: 'paragraph', text: 'Un programa es un conjunto de instrucciones que realiza tareas. En un flujo único, esas tareas avanzan de forma secuencial. En un flujo múltiple, varias secuencias pueden progresar de forma concurrente dentro del mismo proceso.' },
          { type: 'note', title: 'Concurrencia y simultaneidad', text: 'Concurrencia significa que varias tareas progresan durante un mismo intervalo. La ejecución simultánea depende de que haya varios núcleos disponibles.' },
          { type: 'paragraph', text: 'Un hilo es una secuencia de instrucciones con estado de ejecución propio. Cada proceso en marcha tiene al menos un hilo; puede tener varios que ejecuten tareas diferentes.' }
        ]
      },
      {
        title: 'Proceso e hilo',
        blocks: [
          { type: 'paragraph', text: 'Un proceso es un programa en ejecución con su propio espacio de memoria y recursos. Un hilo es una unidad de ejecución que pertenece a un proceso.' },
          { type: 'table', headers: ['Característica', 'Proceso', 'Hilo'], rows: [
            ['Independencia', 'Espacio de ejecución independiente', 'Forma parte de un proceso'],
            ['Memoria', 'Espacio propio', 'Comparte datos del proceso'],
            ['Comunicación', 'Suele requerir mecanismos entre procesos', 'Puede usar memoria compartida'],
            ['Creación y cambio', 'Generalmente más costosos', 'Generalmente más rápidos'],
            ['Recursos', 'Mayor consumo', 'Comparte recursos del proceso']
          ] }
        ]
      },
      {
        title: 'Qué comparten y qué conservan',
        blocks: [
          { type: 'paragraph', text: 'Cada hilo mantiene su propio identificador, contador de programa, registros y pila. La pila contiene las llamadas a métodos, parámetros y variables locales.' },
          { type: 'list', items: ['Compartidos entre los hilos del proceso: código, objetos y datos, archivos y conexiones.', 'Propios de cada hilo: estado de ejecución y pila.', 'Compartir memoria facilita la comunicación, pero exige coordinar las modificaciones concurrentes.'] }
        ]
      },
      {
        title: 'Elementos internos del hilo',
        blocks: [
          { type: 'table', headers: ['Elemento', 'Función', 'Propiedad'], rows: [
            ['Identificador', 'Distingue un hilo de los demás.', 'Propio del hilo'],
            ['Contador de programa', 'Indica la siguiente instrucción que debe ejecutarse.', 'Propio del hilo'],
            ['Registros', 'Mantienen valores temporales de la ejecución.', 'Propios del hilo'],
            ['Pila', 'Guarda llamadas, parámetros y variables locales.', 'Propia del hilo'],
            ['Código y datos del proceso', 'Instrucciones y objetos a los que los hilos pueden acceder.', 'Compartidos'],
            ['Recursos', 'Archivos, conexiones y recursos asociados al proceso.', 'Compartidos']
          ] },
          { type: 'note', title: 'Memoria compartida', text: 'Aunque dos hilos puedan acceder al mismo objeto, cada hilo conserva su propia pila. Las variables locales no se convierten en compartidas por el hecho de ejecutar varios hilos.' }
        ]
      },
      {
        title: 'Ventajas y usos',
        blocks: [
          { type: 'list', items: ['Crear, finalizar y cambiar entre hilos suele ser menos costoso que hacerlo entre procesos del mismo tamaño.', 'Se aprovechan los recursos y datos compartidos del proceso, sin duplicar todo su espacio de memoria.', 'Una operación lenta no tiene por qué bloquear la respuesta de las demás tareas.', 'En procesadores multinúcleo, varios hilos pueden ejecutarse en paralelo.', 'Son útiles en servidores, interfaces gráficas, entrada/salida, dispositivos de comunicación y procesamiento de datos.'] },
          { type: 'paragraph', text: 'En un servidor sencillo, un hilo puede recibir peticiones y crear otro hilo para atender cada una. Así, mientras uno procesa una petición, el servidor puede aceptar más. Crear un hilo por petición tiene un coste; en aplicaciones reales suele preferirse un pool con un número controlado de trabajadores.' },
            { type: 'code', caption: 'Simular varias peticiones atendidas por hilos', code: `public class ServidorSimulado {
        public static void main(String[] args) throws InterruptedException {
          Thread[] peticiones = new Thread[5];
          for (int indice = 0; indice < peticiones.length; indice++) {
            final int numero = indice + 1;
            peticiones[indice] = new Thread(() -> {
              System.out.println("Procesando petición " + numero);
              try {
                Thread.sleep(500);
                System.out.println("Petición " + numero + " completada");
              } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
              }
            });
            peticiones[indice].start();
          }
          for (Thread peticion : peticiones) peticion.join();
          System.out.println("Todas las peticiones terminaron");
        }
      }` },
          { type: 'note', title: 'Compartir también exige coordinar', text: 'El acceso a memoria común simplifica la comunicación, pero varios hilos que modifican el mismo estado pueden producir condiciones de carrera. La coordinación debe diseñarse explícitamente.' }
        ]
      }
    ]
  },
  {
    id: 2,
    title: 'Multitarea y concurrencia',
    summary: 'Diferencia cómo un sistema alterna tareas, aprovecha la CPU y ejecuta trabajo en paralelo.',
    sections: [
      {
        title: 'Multitarea y multiprogramación',
        blocks: [
          { type: 'paragraph', text: 'La multitarea permite que el sistema gestione varias tareas durante un mismo periodo. En un solo núcleo, la CPU alterna rápidamente entre ellas; en un sistema multinúcleo, algunas pueden ejecutarse a la vez.' },
          { type: 'paragraph', text: 'La multiprogramación mantiene varios programas disponibles en memoria. Si uno espera una operación de entrada o salida, el sistema puede dar tiempo de CPU a otro.' },
          { type: 'table', headers: ['Aspecto', 'Multitarea', 'Multiprogramación'], rows: [
            ['Objetivo', 'Gestionar tareas con buena respuesta', 'Aprovechar mejor la CPU'],
            ['Enfoque', 'Concurrencia y progreso', 'Programas disponibles para ejecutar'],
            ['Ejemplo', 'Navegar mientras suena música', 'Ejecutar otro proceso mientras uno espera E/S']
          ] }
        ]
      },
      {
        title: 'Concurrencia frente a paralelismo',
        blocks: [
          { type: 'table', headers: ['Concepto', 'Qué significa', '¿Requiere varios núcleos?'], rows: [
            ['Concurrencia', 'Varias tareas progresan en un mismo intervalo; pueden alternarse.', 'No'],
            ['Paralelismo', 'Varias tareas se ejecutan exactamente al mismo tiempo.', 'Normalmente sí']
          ] },
          { type: 'note', title: 'Idea clave', text: 'Puede haber concurrencia sin paralelismo. La programación multihilo permite organizar tareas concurrentes y puede aprovechar el paralelismo del hardware.' }
        ]
      }
    ]
  },
  {
    id: 3,
    title: 'Crear hilos en Java',
    summary: 'Define el trabajo con Thread o Runnable y entiende qué ocurre al iniciar una tarea.',
    sections: [
      {
        title: 'Thread y Runnable',
        blocks: [
          { type: 'paragraph', text: 'En Java se puede definir una tarea heredando de Thread o implementando Runnable. En ambos casos, run() contiene el trabajo. Llamar a start() crea el nuevo flujo de ejecución y hace que la JVM invoque run() en él.' },
          { type: 'table', headers: ['Opción', 'Ventajas', 'Uso habitual'], rows: [
            ['extends Thread', 'Clase directa para personalizar un hilo.', 'Casos sencillos o específicos.'],
            ['implements Runnable', 'Separa tarea y ejecución; deja libre la herencia de otra clase.', 'Preferible para representar una tarea.']
          ] },
          { type: 'note', title: 'start() no es run()', text: 'start() inicia un hilo nuevo. Si llamas a run() directamente, solo haces una llamada normal dentro del hilo actual.' }
        ]
      },
      {
        title: 'Heredar de Thread',
        blocks: [
          { type: 'code', caption: 'Una subclase define run() y se inicia con start()', code: `class HiloSaludo extends Thread {
    private final String etiqueta;

    HiloSaludo(String etiqueta) {
        this.etiqueta = etiqueta;
    }

    @Override
    public void run() {
        for (int i = 1; i <= 5; i++) {
            System.out.println(etiqueta + " saluda " + i);
        }
    }
}

new HiloSaludo("A").start();` },
          { type: 'paragraph', text: 'El planificador decide cuándo progresa cada hilo. La salida puede intercalarse de formas distintas; no se debe depender de un orden entre tareas que no se haya sincronizado.' }
        ]
      },
      {
        title: 'Implementar Runnable',
        blocks: [
          { type: 'code', caption: 'La tarea se pasa al objeto Thread', code: `Runnable tarea = () ->
    System.out.println("Trabajo en " + Thread.currentThread().getName());

Thread hilo = new Thread(tarea, "Trabajador");
hilo.start();` },
          { type: 'list', items: ['Runnable describe lo que hay que ejecutar.', 'Thread representa el hilo que ejecutará esa tarea.', 'Esta separación facilita reutilizar la tarea y combinarla con herramientas de concurrencia.'] }
        ]
      },
      {
        title: 'Estados de un hilo',
        blocks: [
          { type: 'table', headers: ['Estado', 'Significado'], rows: [
            ['NEW', 'Creado, pero todavía no iniciado.'],
            ['RUNNABLE', 'Preparado para ejecutarse o ejecutándose.'],
            ['BLOCKED', 'Esperando adquirir un monitor.'],
            ['WAITING', 'Esperando indefinidamente un evento.'],
            ['TIMED_WAITING', 'Esperando durante un tiempo limitado.'],
            ['TERMINATED', 'La ejecución ha finalizado.']
          ] },
          { type: 'code', caption: 'join() permite observar la terminación', code: `Thread hilo = new Thread(() -> System.out.println("En marcha"));
System.out.println(hilo.getState()); // NEW
hilo.start();
hilo.join();
System.out.println(hilo.getState()); // TERMINATED` }
        ]
      }
    ]
  },
  {
    id: 4,
    title: 'La API Thread',
    summary: 'Consulta el hilo actual, espera, nombra trabajadores y solicita su terminación cooperativa.',
    sections: [
      {
        title: 'Métodos estáticos',
        blocks: [
          { type: 'table', headers: ['Método', 'Función'], rows: [
            ['Thread.currentThread()', 'Devuelve el objeto Thread que está ejecutando el código actual.'],
            ['Thread.sleep(ms)', 'Pausa el hilo actual durante un tiempo aproximado. Puede lanzar InterruptedException.'],
            ['Thread.yield()', 'Sugiere al planificador ceder la ejecución; no garantiza que otro hilo avance.']
          ] },
          { type: 'code', caption: 'La pausa afecta al hilo que la invoca', code: `try {
    Thread.sleep(1000);
} catch (InterruptedException e) {
    Thread.currentThread().interrupt();
}` }
        ]
      },
      {
        title: 'Métodos de instancia',
        blocks: [
          { type: 'table', headers: ['Método', 'Función'], rows: [
            ['start()', 'Inicia un flujo nuevo que ejecutará run().'],
            ['run()', 'Contiene la tarea; una llamada directa no inicia otro hilo.'],
            ['join()', 'Espera a que termine el hilo indicado.'],
            ['isAlive()', 'Indica si el hilo ya comenzó y todavía no ha terminado.'],
            ['setName() / getName()', 'Asigna o consulta el nombre descriptivo del hilo.'],
            ['interrupt()', 'Solicita una interrupción; el hilo debe atenderla.']
          ] },
          { type: 'code', caption: 'Lanzar dos hilos y esperar su finalización', code: `Thread primero = new Thread(tarea, "Trabajador-1");
Thread segundo = new Thread(tarea, "Trabajador-2");

primero.start();
segundo.start();
primero.join();
segundo.join();
System.out.println("Todos han terminado");` }
        ]
      },
      {
        title: 'Interrupción y métodos obsoletos',
        blocks: [
          { type: 'paragraph', text: 'La interrupción es una petición cooperativa: no mata el hilo. El trabajador puede consultar isInterrupted() o recibir InterruptedException si estaba en una operación interrumpible.' },
          { type: 'note', title: 'No uses stop(), suspend() ni resume()', text: 'Estos métodos pueden dejar recursos y datos en estados inconsistentes. Para terminar una tarea, diseña una condición de salida y responde a interrupt().' },
          { type: 'code', caption: 'Restaurar la marca si se termina al capturar la excepción', code: `try {
    Thread.sleep(200);
} catch (InterruptedException e) {
    Thread.currentThread().interrupt();
    return;
}` }
        ]
      },
      {
        title: 'Prioridades y constructores',
        blocks: [
          { type: 'table', headers: ['API', 'Uso', 'Límite'], rows: [
            ['setPriority() / getPriority()', 'Asigna o consulta una prioridad entre MIN_PRIORITY (1) y MAX_PRIORITY (10).', 'La prioridad no garantiza el orden de ejecución.'],
            ['Thread()', 'Crea un hilo sin una tarea concreta.', 'Por sí solo no hace trabajo útil.'],
            ['Thread(String nombre)', 'Crea un hilo con nombre personalizado.', 'Hay que definir también la tarea.'],
            ['Thread(Runnable tarea)', 'Asocia una tarea al hilo.', 'El nombre se asigna por separado.'],
            ['Thread(Runnable tarea, String nombre)', 'Asocia tarea y nombre al crear el hilo.', 'Es una forma directa de configurar ambos.']
          ] },
          { type: 'code', caption: 'Nombrar y asignar prioridad sin depender de ella', code: `Runnable tarea = () -> System.out.println(Thread.currentThread().getName());
Thread trabajador = new Thread(tarea, "Trabajador-1");
trabajador.setPriority(Thread.NORM_PRIORITY);
System.out.println(trabajador.getPriority());
trabajador.start();` },
          { type: 'note', title: 'La prioridad es una sugerencia', text: 'El planificador y el sistema operativo determinan cómo influyen las prioridades. No uses setPriority() para exigir que un hilo se ejecute primero.' }
        ]
      }
    ]
  },
  {
    id: 5,
    title: 'Sincronización y monitores',
    summary: 'Protege los datos compartidos frente a condiciones de carrera con synchronized.',
    sections: [
      {
        title: 'Condiciones de carrera',
        blocks: [
          { type: 'paragraph', text: 'Una condición de carrera aparece cuando el resultado depende del orden de ejecución de los hilos. Una expresión como contador++ parece única, pero combina leer el valor, calcular el siguiente y escribirlo.' },
          { type: 'note', title: 'Actualización perdida', text: 'Dos hilos pueden leer el mismo valor antes de escribir. Ambos calculan el mismo resultado y una de las actualizaciones se pierde.' }
        ]
      },
      {
        title: 'Métodos y bloques synchronized',
        blocks: [
          { type: 'code', caption: 'Un mismo objeto Contador actúa como monitor', code: `class Contador {
    private int valor;

    public synchronized void incrementar() {
        valor++;
    }

    public synchronized int consultar() {
        return valor;
    }
}` },
          { type: 'paragraph', text: 'Un método de instancia synchronized adquiere el monitor del objeto actual. Un bloque synchronized permite elegir el objeto y limitar la sección crítica a las instrucciones que necesitan protección.' },
            { type: 'code', caption: 'Un bloqueo explícito para una región crítica pequeña', code: `class ContadorConBloque {
        private final Object bloqueo = new Object();
        private int valor;

        public void incrementar() {
          synchronized (bloqueo) {
            valor++;
          }
        }
      }` },
          { type: 'note', title: 'El cerrojo debe ser compartido', text: 'Si cada hilo sincroniza con un objeto distinto, cada uno adquiere un monitor diferente y no se excluyen entre sí.' }
        ]
      },
      {
        title: 'Reglas para una sección crítica',
        blocks: [
          { type: 'list', items: ['Protege conjuntamente las operaciones que mantienen una misma condición: comprobar y actualizar.', 'Usa el mismo monitor en todos los hilos que comparten ese estado.', 'Mantén breves las secciones sincronizadas.', 'No duermas ni esperes join() mientras mantienes un monitor.'] }
        ]
      }
    ]
  },
  {
    id: 6,
    title: 'Coordinación avanzada',
    summary: 'Espera por condiciones, notificaciones, bloqueos explícitos, semáforos y ejecutores.',
    sections: [
      {
        title: 'wait(), notify() y notifyAll()',
        blocks: [
          { type: 'paragraph', text: 'wait() suspende el hilo actual y libera temporalmente el monitor del objeto. Para continuar, el hilo debe volver a adquirirlo. notify() despierta a un participante en espera; notifyAll() despierta a todos, que competirán por el monitor.' },
          { type: 'code', caption: 'Esperar siempre con while y comprobar una condición compartida', code: `synchronized (monitor) {
    while (!disponible) {
        monitor.wait();
    }
    usarRecurso();
}

synchronized (monitor) {
    disponible = true;
    monitor.notifyAll();
}` },
          { type: 'note', title: 'La condición es la verdad; el aviso solo despierta', text: 'Una notificación puede ocurrir antes de que un hilo empiece a esperar y un hilo puede despertar sin que la condición que necesita siga cumpliéndose. El estado se actualiza bajo el mismo monitor y se vuelve a comprobar con while.' }
        ]
      },
      {
        title: 'Lock y ReentrantLock',
        blocks: [
          { type: 'paragraph', text: 'La interfaz Lock permite adquirir y liberar bloqueos explícitamente. ReentrantLock ofrece operaciones de control adicionales; el desbloqueo debe garantizarse con finally.' },
          { type: 'code', caption: 'Contador completo con ReentrantLock', code: `import java.util.concurrent.locks.Lock;
    import java.util.concurrent.locks.ReentrantLock;

    public class ContadorConLock {
      private final Lock lock = new ReentrantLock();
      private int valor;

      public void incrementar() {
        lock.lock();
        try {
          valor++;
        } finally {
          lock.unlock();
        }
      }

      public int consultar() {
        lock.lock();
        try {
          return valor;
        } finally {
          lock.unlock();
        }
      }
    }` }
        ]
      },
      {
        title: 'Semáforos y barreras de finalización',
        blocks: [
          { type: 'paragraph', text: 'Semaphore administra permisos para limitar cuántos hilos usan un recurso a la vez. CountDownLatch mantiene una cuenta atrás y permite que otros hilos esperen a que llegue a cero.' },
          { type: 'code', caption: 'Limitar a dos los accesos simultáneos', code: `import java.util.concurrent.Semaphore;

    public class AccesoLimitado implements Runnable {
      private static final Semaphore PERMISOS = new Semaphore(2);

      @Override
      public void run() {
        boolean adquirido = false;
        try {
          PERMISOS.acquire();
          adquirido = true;
          System.out.println(Thread.currentThread().getName() + " entra");
          Thread.sleep(500);
        } catch (InterruptedException e) {
          Thread.currentThread().interrupt();
        } finally {
          if (adquirido) PERMISOS.release();
        }
      }

      public static void main(String[] args) {
        for (int numero = 1; numero <= 5; numero++) {
          new Thread(new AccesoLimitado(), "Hilo-" + numero).start();
        }
      }
    }` },
          { type: 'code', caption: 'Esperar a tres tareas con CountDownLatch', code: `import java.util.concurrent.CountDownLatch;

    public class EsperarTareas {
      public static void main(String[] args) throws InterruptedException {
        CountDownLatch latch = new CountDownLatch(3);
        for (int numero = 1; numero <= 3; numero++) {
          final int tarea = numero;
          new Thread(() -> {
            try {
              System.out.println("Tarea " + tarea + " terminada");
            } finally {
              latch.countDown();
            }
          }).start();
        }
        latch.await();
        System.out.println("Todas las tareas terminaron");
      }
    }` }
        ]
      },
      {
        title: 'AtomicInteger y ExecutorService',
        blocks: [
          { type: 'paragraph', text: 'AtomicInteger proporciona operaciones atómicas para un entero, como incrementAndGet(). ExecutorService administra un conjunto de trabajadores y distribuye tareas sin crear manualmente un hilo por cada una.' },
          { type: 'code', caption: 'Compartir un contador atómico', code: `import java.util.concurrent.atomic.AtomicInteger;

    public class ContadorAtomico {
      public static void main(String[] args) throws InterruptedException {
        AtomicInteger contador = new AtomicInteger();
        Thread[] hilos = new Thread[3];
        for (int indice = 0; indice < hilos.length; indice++) {
          hilos[indice] = new Thread(() -> {
            for (int vuelta = 0; vuelta < 1000; vuelta++) {
              contador.incrementAndGet();
            }
          });
          hilos[indice].start();
        }
        for (Thread hilo : hilos) hilo.join();
        System.out.println("Resultado: " + contador.get());
      }
    }` },
          { type: 'code', caption: 'Ejecutar tareas en un pool fijo', code: `import java.util.concurrent.ExecutorService;
    import java.util.concurrent.Executors;
    import java.util.concurrent.TimeUnit;

    public class PoolDeTareas {
      public static void main(String[] args) throws InterruptedException {
        ExecutorService pool = Executors.newFixedThreadPool(3);
        for (int numero = 1; numero <= 6; numero++) {
          final int tarea = numero;
          pool.execute(() -> System.out.println(
            "Tarea " + tarea + " en " + Thread.currentThread().getName()
          ));
        }
        pool.shutdown();
        if (!pool.awaitTermination(1, TimeUnit.MINUTES)) {
          pool.shutdownNow();
        }
      }
    }` }
        ]
      },
      {
        title: 'Deadlock y visibilidad',
        blocks: [
          { type: 'paragraph', text: 'Un deadlock o interbloqueo ocurre cuando varios hilos esperan recursos retenidos por los demás. Adquirir siempre varios bloqueos en el mismo orden ayuda a evitar esperas circulares.' },
          { type: 'paragraph', text: 'volatile aporta garantías de visibilidad para lecturas y escrituras de una variable entre hilos. No convierte una operación compuesta como contador++ en atómica.' },
          { type: 'code', caption: 'Una bandera volatile para pedir que una tarea termine', code: `public class ControlHilo implements Runnable {
      private volatile boolean activo = true;

      public void detener() {
        activo = false;
      }

      @Override
      public void run() {
        while (activo) {
          realizarUnPasoDeTrabajo();
        }
      }

      private void realizarUnPasoDeTrabajo() {
        System.out.println("Paso de trabajo");
      }
    }` },
          { type: 'list', items: ['Adquiere varios bloqueos siempre en el mismo orden.', 'Evita retener recursos mientras esperas otros eventos.', 'Usa AtomicInteger, synchronized o Lock cuando necesites operaciones atómicas.', 'Usa volatile para visibilidad de una bandera simple, no para proteger actualizaciones compuestas.'] }
        ]
      }
    ]
  },
  {
    id: 7,
    title: 'Ejercicios propuestos',
    summary: 'Conecta los diez ejercicios del material teórico con las explicaciones y prácticas del curso.',
    sections: [
      {
        title: 'Mapa de los ejercicios del material',
        blocks: [
          { type: 'table', headers: ['Ejercicio original', 'Concepto principal', 'Dónde continuar'], rows: [
            ['1. Crear un hilo con Thread', 'extends Thread, run(), start()', 'Práctica 01 y capítulo 03'],
            ['2. Crear varios hilos con Runnable', 'Runnable y separación de tarea', 'Práctica 02 y capítulo 03'],
            ['3. Utilizar sleep()', 'Pausa e interrupción', 'Práctica 04 y capítulo 04'],
            ['4. Utilizar join()', 'Esperar a la terminación', 'Práctica 03 y capítulo 04'],
            ['5. Contador compartido', 'synchronized y carrera de datos', 'Prácticas 05–06 y capítulo 05'],
            ['6. Comunicación entre hilos', 'wait(), notifyAll() y condición', 'Prácticas 08–10 y capítulo 06'],
            ['7. Controlar accesos con Semaphore', 'Permisos y liberación segura', 'Capítulo 06 · Semáforos'],
            ['8. Contador con AtomicInteger', 'Actualización atómica', 'Capítulo 06 · AtomicInteger'],
            ['9. Ejecutar con ExecutorService', 'Pool, cierre y espera', 'Capítulo 06 · ExecutorService'],
            ['10. Simular un servidor multihilo', 'Una tarea concurrente por petición', 'Capítulo 01 · Ventajas y usos']
          ] },
          { type: 'note', title: 'Teoría y práctica', text: 'Los capítulos contienen las explicaciones y ejemplos del documento base. La pestaña Práctica reúne veinte retos graduados con soluciones en archivos separados cuando el ejercicio lo requiere.' }
        ]
      },
      {
        title: 'Antes de dar por terminado un ejercicio',
        blocks: [
          { type: 'list', items: ['Identifica qué datos comparten los hilos.', 'Define quién puede modificar cada dato y bajo qué monitor.', 'Comprueba que toda espera usa una condición y un bucle while.', 'Decide cómo responderán los hilos a una interrupción.', 'Espera su terminación y verifica los resultados con más de una ejecución.'] }
        ]
      }
    ]
  },
  {
    id: 8,
    title: 'Resumen de referencia',
    summary: 'Consulta rápida de los conceptos, métodos y herramientas principales.',
    sections: [
      {
        title: 'Conceptos clave',
        blocks: [
          { type: 'table', headers: ['Elemento', 'Recordatorio'], rows: [
            ['Proceso', 'Programa en ejecución con recursos y espacio de memoria propios.'],
            ['Hilo', 'Flujo de ejecución dentro de un proceso.'],
            ['Concurrencia', 'Varias tareas progresan durante un mismo intervalo.'],
            ['Paralelismo', 'Varias tareas se ejecutan realmente al mismo tiempo.'],
            ['Thread / Runnable', 'Representa el hilo / define una tarea ejecutable.'],
            ['start() / run()', 'Inicia otro hilo / contiene el trabajo ejecutado.'],
            ['sleep() / join()', 'Pausa el hilo actual / espera a que otro termine.'],
            ['synchronized', 'Protege una sección mediante un monitor compartido.'],
            ['wait() / notifyAll()', 'Espera liberando un monitor / despierta a quienes esperan.'],
            ['Semaphore', 'Limita el número de accesos simultáneos.'],
            ['AtomicInteger', 'Ofrece operaciones atómicas sobre un entero.'],
            ['ExecutorService', 'Administra y reutiliza trabajadores para ejecutar tareas.'],
            ['volatile', 'Aporta visibilidad; no hace atómicas las operaciones compuestas.']
          ] }
        ]
      },
      {
        title: 'Tres preguntas para revisar tu diseño',
        blocks: [
          { type: 'list', items: ['¿Qué pasa si dos hilos llegan a la sección crítica a la vez?', '¿Se sigue cumpliendo la condición después de despertar de wait()?', '¿Todos los hilos pueden terminar si una espera o tarea es interrumpida?'] }
        ]
      }
    ]
  },
  {
    id: 9,
    title: 'Conclusión',
    summary: 'Diseña tareas concurrentes que sigan siendo comprensibles, coordinadas y seguras.',
    sections: [
      {
        title: 'Pensar en tareas y coordinación',
        blocks: [
          { type: 'paragraph', text: 'La programación multihilo permite que distintas tareas progresen dentro de una aplicación y puede mejorar su capacidad de respuesta y el aprovechamiento de procesadores multinúcleo.' },
          { type: 'paragraph', text: 'Java permite definir tareas mediante Runnable y ejecutarlas con Thread o con herramientas de más alto nivel. Cuando hay estado compartido, el diseño debe incluir una estrategia explícita de sincronización, espera y cancelación.' },
          { type: 'note', title: 'Regla práctica', text: 'Primero define el estado y las condiciones; después decide qué hilos pueden cambiarlo y cómo se despertarán. La concurrencia correcta depende del protocolo, no de que una ejecución concreta parezca ordenada.' }
        ]
      }
    ]
  }
];