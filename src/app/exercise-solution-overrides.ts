import { ExerciseSourceFile } from './exercise-solution-files';

export interface ExerciseSolutionOverride {
  explanation: string;
  files: ExerciseSourceFile[];
}

export const EXERCISE_SOLUTION_OVERRIDES: Record<number, ExerciseSolutionOverride> = {
  5: {
    explanation: 'Los cuatro hilos comparten una sola instancia de Contador. Main repite diez veces la prueba sin sincronización para observar que una condición de carrera puede, pero no tiene por qué, producir pérdidas.',
    files: [
      {
        filename: 'Contador.java',
        code: `public class Contador {
    private int valor;
    public void incrementar() { valor++; }
    public int getValor() { return valor; }
}`
      },
      {
        filename: 'Tareas.java',
        code: `public class Tareas implements Runnable {
    private final Contador contador;
    public Tareas(Contador contador) { this.contador = contador; }

    @Override
    public void run() {
        for (int vuelta = 0; vuelta < 100_000; vuelta++) contador.incrementar();
    }
}`
      },
      {
        filename: 'Main.java',
        code: `public class Main {
    private static int ejecutarPrueba() throws InterruptedException {
        Contador contador = new Contador();
        Thread[] hilos = new Thread[4];
        for (int indice = 0; indice < hilos.length; indice++) {
            hilos[indice] = new Thread(new Tareas(contador));
            hilos[indice].start();
        }
        for (Thread hilo : hilos) hilo.join();
        return contador.getValor();
    }

    public static void main(String[] args) throws InterruptedException {
        for (int prueba = 1; prueba <= 10; prueba++) {
            System.out.println("Prueba " + prueba + ": " + ejecutarPrueba());
        }
        System.out.println("Máximo esperado por prueba: 400000");
    }
}`
      }
    ]
  },
  6: {
    explanation: 'Se ejecutan diez pruebas por variante. Cada prueba crea un contador nuevo y cuatro tareas; tanto el método synchronized como el bloque sobre el mismo contador deben alcanzar 400000.',
    files: [
      {
        filename: 'Contador.java',
        code: `public class Contador {
    private int valor;
    public synchronized void incrementar() { valor++; }
    public void incrementarConBloque() { synchronized (this) { valor++; } }
    public synchronized int getValor() { return valor; }
}`
      },
      {
        filename: 'Tareas.java',
        code: `public class Tareas implements Runnable {
    private final Contador contador;
    private final boolean usarBloque;

    public Tareas(Contador contador, boolean usarBloque) {
        this.contador = contador;
        this.usarBloque = usarBloque;
    }

    @Override
    public void run() {
        for (int vuelta = 0; vuelta < 100_000; vuelta++) {
            if (usarBloque) contador.incrementarConBloque();
            else contador.incrementar();
        }
    }
}`
      },
      {
        filename: 'Main.java',
        code: `public class Main {
    private static int ejecutarPrueba(boolean usarBloque) throws InterruptedException {
        Contador contador = new Contador();
        Thread[] hilos = new Thread[4];
        for (int indice = 0; indice < hilos.length; indice++) {
            hilos[indice] = new Thread(new Tareas(contador, usarBloque));
            hilos[indice].start();
        }
        for (Thread hilo : hilos) hilo.join();
        return contador.getValor();
    }

    public static void main(String[] args) throws InterruptedException {
        for (int prueba = 1; prueba <= 10; prueba++) {
            System.out.println("Método, prueba " + prueba + ": " + ejecutarPrueba(false));
        }
        for (int prueba = 1; prueba <= 10; prueba++) {
            System.out.println("Bloque, prueba " + prueba + ": " + ejecutarPrueba(true));
        }
    }
}`
      }
    ]
  },
  12: {
    explanation: 'La primera ejecución produce y consume los diez datos en orden. La segunda interrumpe a ambos participantes; si esperan en wait(), la excepción se propaga hasta run(), se restaura la marca y los hilos terminan.',
    files: [
      {
        filename: 'Buzon.java',
        code: `public class Buzon {
    private int dato;
    private boolean lleno;

    public synchronized void poner(int valor) throws InterruptedException {
        while (lleno) wait();
        dato = valor;
        lleno = true;
        notifyAll();
    }

    public synchronized int recoger() throws InterruptedException {
        while (!lleno) wait();
        int valor = dato;
        lleno = false;
        notifyAll();
        return valor;
    }
}`
      },
      {
        filename: 'Productor.java',
        code: `public class Productor implements Runnable {
    private final Buzon buzon;
    public Productor(Buzon buzon) { this.buzon = buzon; }

    @Override
    public void run() {
        try {
            for (int numero = 1; numero <= 10; numero++) {
                buzon.poner(numero);
                Thread.sleep(30);
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}`
      },
      {
        filename: 'Consumidor.java',
        code: `public class Consumidor implements Runnable {
    private final Buzon buzon;
    public Consumidor(Buzon buzon) { this.buzon = buzon; }

    @Override
    public void run() {
        try {
            for (int cuenta = 0; cuenta < 10; cuenta++) {
                System.out.println("Recibido: " + buzon.recoger());
                Thread.sleep(40);
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}`
      },
      {
        filename: 'Main.java',
        code: `public class Main {
    private static void ejecutar(boolean cancelar) throws InterruptedException {
        Buzon buzon = new Buzon();
        Thread productor = new Thread(new Productor(buzon), "Productor");
        Thread consumidor = new Thread(new Consumidor(buzon), "Consumidor");
        productor.start();
        consumidor.start();
        if (cancelar) {
            Thread.sleep(150);
            productor.interrupt();
            consumidor.interrupt();
        }
        productor.join();
        consumidor.join();
        System.out.println("Terminaron ambos; cancelación=" + cancelar);
    }

    public static void main(String[] args) throws InterruptedException {
        ejecutar(false);
        ejecutar(true);
    }
}`
      }
    ]
  },
  15: {
    explanation: 'La ejecución normal imprime la secuencia exacta sin usar sleep para coordinar. En la variante de cancelación, se interrumpe al participante B mientras espera su turno; activar cancelado y notificar a todos evita que A quede bloqueado.',
    files: [
      {
        filename: 'Turnos.java',
        code: `public class Turnos {
    private char turno = 'A';
    private boolean cancelado;

    public synchronized boolean imprimirSiToca(char letra) throws InterruptedException {
        while (!cancelado && turno != letra) wait();
        if (cancelado) return false;
        System.out.print(letra);
        turno = letra == 'A' ? 'B' : 'A';
        notifyAll();
        return true;
    }

    public synchronized void cancelar() {
        cancelado = true;
        notifyAll();
    }
}`
      },
      {
        filename: 'Impresor.java',
        code: `public class Impresor implements Runnable {
    private final Turnos turnos;
    private final char letra;
    public Impresor(Turnos turnos, char letra) { this.turnos = turnos; this.letra = letra; }

    @Override
    public void run() {
        try {
            for (int cuenta = 0; cuenta < 5; cuenta++) {
                if (!turnos.imprimirSiToca(letra)) return;
            }
        } catch (InterruptedException e) {
            turnos.cancelar();
            Thread.currentThread().interrupt();
        }
    }
}`
      },
      {
        filename: 'Main.java',
        code: `public class Main {
    private static void ejecutar(boolean cancelar) throws InterruptedException {
        Turnos turnos = new Turnos();
        Thread hiloA = new Thread(new Impresor(turnos, 'A'), "Hilo-A");
        Thread hiloB = new Thread(new Impresor(turnos, 'B'), "Hilo-B");
        if (cancelar) {
            hiloB.start();
            hiloB.interrupt();
            hiloA.start();
        } else {
            hiloA.start();
            hiloB.start();
        }
        hiloA.join();
        hiloB.join();
        System.out.println();
    }

    public static void main(String[] args) throws InterruptedException {
        ejecutar(false);
        ejecutar(true);
    }
}`
      }
    ]
  },
  10: {
    explanation: 'La puerta recuerda si está abierta, así que abrirla antes de iniciar los visitantes también funciona. Main ejecuta las dos variantes.',
    files: [
      {
        filename: 'Puerta.java',
        code: `public class Puerta {
    private boolean abierta;

    public synchronized void esperarPaso() throws InterruptedException {
        while (!abierta) {
            wait();
        }
        System.out.println(Thread.currentThread().getName() + " pasa");
    }

    public synchronized void abrir() {
        abierta = true;
        notifyAll();
    }
}`
      },
      {
        filename: 'Main.java',
        code: `public class Main {
    private static void ejecutar(boolean abrirAntes) throws InterruptedException {
        Puerta puerta = new Puerta();
        Thread[] visitantes = new Thread[5];
        for (int indice = 0; indice < visitantes.length; indice++) {
            visitantes[indice] = new Thread(() -> {
                try {
                    puerta.esperarPaso();
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }, "Visitante-" + (indice + 1));
        }

        if (abrirAntes) {
            puerta.abrir();
            for (Thread visitante : visitantes) visitante.start();
        } else {
            for (Thread visitante : visitantes) visitante.start();
            Thread.sleep(200);
            puerta.abrir();
        }
        for (Thread visitante : visitantes) visitante.join();
    }

    public static void main(String[] args) throws InterruptedException {
        ejecutar(false);
        ejecutar(true);
    }
}`
      }
    ]
  },
  13: {
    explanation: 'El árbitro y los corredores están separados. Main prueba primero los cuatro corredores esperando y después deja que uno arranque tras terminar el árbitro; la condición persistente permite ambos casos.',
    files: [
      {
        filename: 'Salida.java',
        code: `public class Salida {
    private boolean dada;

    public synchronized void esperar() throws InterruptedException {
        while (!dada) {
            wait();
        }
    }

    public synchronized void dar() {
        System.out.println("Salida");
        dada = true;
        notifyAll();
    }
}`
      },
      {
        filename: 'Arbitro.java',
        code: `public class Arbitro extends Thread {
    private final Salida salida;

    public Arbitro(Salida salida) {
        this.salida = salida;
    }

    @Override
    public void run() {
        try {
            for (int cuenta = 3; cuenta >= 1; cuenta--) {
                System.out.println(cuenta);
                Thread.sleep(300);
            }
            salida.dar();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            salida.dar();
        }
    }
}`
      },
      {
        filename: 'Corredor.java',
        code: `public class Corredor implements Runnable {
    private final Salida salida;

    public Corredor(Salida salida) {
        this.salida = salida;
    }

    @Override
    public void run() {
        try {
            salida.esperar();
            for (int paso = 1; paso <= 3; paso++) {
                System.out.println(Thread.currentThread().getName() + " paso " + paso);
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}`
      },
      {
        filename: 'Main.java',
        code: `public class Main {
    private static Thread crearCorredor(Salida salida, int numero) {
        return new Thread(new Corredor(salida), "Corredor-" + numero);
    }

    private static void ejecutar(boolean corredorTardio) throws InterruptedException {
        Salida salida = new Salida();
        Arbitro arbitro = new Arbitro(salida);
        Thread[] corredores = new Thread[4];
        for (int indice = 0; indice < corredores.length; indice++) {
            corredores[indice] = crearCorredor(salida, indice + 1);
        }

        if (corredorTardio) {
            for (int indice = 0; indice < 3; indice++) corredores[indice].start();
            arbitro.start();
            arbitro.join();
            corredores[3].start();
        } else {
            for (Thread corredor : corredores) corredor.start();
            arbitro.start();
            arbitro.join();
        }
        for (Thread corredor : corredores) corredor.join();
    }

    public static void main(String[] args) throws InterruptedException {
        ejecutar(false);
        ejecutar(true);
    }
}`
      }
    ]
  },
  14: {
    explanation: 'La cola, el trabajador y Main son archivos distintos. El trabajador conserva el encargo actual para informar si se interrumpe durante el procesamiento; Main prueba con cinco encargos y con la cola inicialmente vacía.',
    files: [
      {
        filename: 'ColaEncargos.java',
        code: `import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.List;
import java.util.Queue;

public class ColaEncargos {
    private final Queue<Integer> cola = new ArrayDeque<>();

    public synchronized void anadir(int encargo) {
        cola.add(encargo);
        notifyAll();
    }

    public synchronized int extraer() throws InterruptedException {
        while (cola.isEmpty()) {
            wait();
        }
        return cola.remove();
    }

    public synchronized List<Integer> pendientes() {
        return new ArrayList<>(cola);
    }
}`
      },
      {
        filename: 'Trabajador.java',
        code: `import java.util.List;

public class Trabajador extends Thread {
    private final ColaEncargos cola;
    private final List<Integer> completados;
    private final List<Integer> cancelados;

    public Trabajador(ColaEncargos cola, List<Integer> completados, List<Integer> cancelados) {
        this.cola = cola;
        this.completados = completados;
        this.cancelados = cancelados;
    }

    @Override
    public void run() {
        int actual = -1;
        try {
            while (!isInterrupted()) {
                actual = cola.extraer();
                Thread.sleep(300);
                completados.add(actual);
                actual = -1;
            }
        } catch (InterruptedException e) {
            if (actual != -1) cancelados.add(actual);
            interrupt();
        }
    }
}`
      },
      {
        filename: 'Main.java',
        code: `import java.util.ArrayList;
import java.util.List;

public class Main {
    private static void ejecutar(int cantidad) throws InterruptedException {
        ColaEncargos cola = new ColaEncargos();
        List<Integer> completados = new ArrayList<>();
        List<Integer> cancelados = new ArrayList<>();
        Trabajador trabajador = new Trabajador(cola, completados, cancelados);
        trabajador.start();
        for (int encargo = 1; encargo <= cantidad; encargo++) cola.anadir(encargo);
        Thread.sleep(500);
        trabajador.interrupt();
        trabajador.join();
        System.out.println("Completados: " + completados);
        System.out.println("Retirado y cancelado: " + cancelados);
        System.out.println("Pendientes: " + cola.pendientes());
    }

    public static void main(String[] args) throws InterruptedException {
        ejecutar(5);
        ejecutar(0);
    }
}`
      }
    ]
  },
  16: {
    explanation: 'Los datos almacenados y retirados se registran dentro del monitor. La versión normal comprueba veinte retiradas; la cancelada interrumpe a todos y permite verificar almacenados = retirados + pendientes. Los no insertados se cuentan aparte.',
    files: [
      {
        filename: 'Almacen.java',
        code: `import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.List;
import java.util.Queue;

public class Almacen {
    private final Queue<String> cola = new ArrayDeque<>();
    private final List<String> almacenados = new ArrayList<>();
    private final List<String> retirados = new ArrayList<>();
    private final int capacidad;
    private int productoresActivos;

    public Almacen(int capacidad, int productores) {
        this.capacidad = capacidad;
        this.productoresActivos = productores;
    }

    public synchronized void poner(String dato) throws InterruptedException {
        while (cola.size() == capacidad) wait();
        cola.add(dato);
        almacenados.add(dato);
        notifyAll();
    }

    public synchronized String retirar() throws InterruptedException {
        while (cola.isEmpty() && productoresActivos > 0) wait();
        if (cola.isEmpty()) return null;
        String dato = cola.remove();
        retirados.add(dato);
        notifyAll();
        return dato;
    }

    public synchronized void productorTerminado() {
        productoresActivos--;
        notifyAll();
    }

    public synchronized List<String> almacenados() { return new ArrayList<>(almacenados); }
    public synchronized List<String> retirados() { return new ArrayList<>(retirados); }
    public synchronized List<String> pendientes() { return new ArrayList<>(cola); }
}`
      },
      {
        filename: 'Productor.java',
        code: `public class Productor implements Runnable {
    private final Almacen almacen;
    private final String nombre;

    public Productor(Almacen almacen, String nombre) {
        this.almacen = almacen;
        this.nombre = nombre;
    }

    @Override
    public void run() {
        try {
            for (int numero = 1; numero <= 10; numero++) {
                if (Thread.currentThread().isInterrupted()) break;
                almacen.poner(nombre + "-" + numero);
                Thread.sleep(15);
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            almacen.productorTerminado();
        }
    }
}`
      },
      {
        filename: 'Consumidor.java',
        code: `public class Consumidor implements Runnable {
    private final Almacen almacen;

    public Consumidor(Almacen almacen) {
        this.almacen = almacen;
    }

    @Override
    public void run() {
        try {
            while (!Thread.currentThread().isInterrupted()) {
                String dato = almacen.retirar();
                if (dato == null) return;
                System.out.println(Thread.currentThread().getName() + " retira " + dato);
                Thread.sleep(80);
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}`
      },
      {
        filename: 'Main.java',
        code: `public class Main {
    private static void ejecutar(int capacidad, boolean cancelar) throws InterruptedException {
        Almacen almacen = new Almacen(capacidad, 2);
        Thread[] productores = {
            new Thread(new Productor(almacen, "P1")),
            new Thread(new Productor(almacen, "P2"))
        };
        Thread[] consumidores = new Thread[3];
        for (int indice = 0; indice < consumidores.length; indice++) {
            consumidores[indice] = new Thread(new Consumidor(almacen), "C" + (indice + 1));
        }
        for (Thread hilo : productores) hilo.start();
        for (Thread hilo : consumidores) hilo.start();

        if (cancelar) {
            Thread.sleep(120);
            for (Thread hilo : productores) hilo.interrupt();
            for (Thread hilo : consumidores) hilo.interrupt();
        }
        for (Thread hilo : productores) hilo.join();
        for (Thread hilo : consumidores) hilo.join();

        int guardados = almacen.almacenados().size();
        int retirados = almacen.retirados().size();
        int pendientes = almacen.pendientes().size();
        System.out.println("Cancelación=" + cancelar + ", capacidad=" + capacidad);
        System.out.println("Almacenados: " + almacen.almacenados());
        System.out.println("Retirados: " + almacen.retirados());
        System.out.println("Siguen dentro: " + almacen.pendientes());
        System.out.println("No insertados: " + (20 - guardados));
        System.out.println("Invariante almacenados = retirados + pendientes: " + (guardados == retirados + pendientes));
    }

    public static void main(String[] args) throws InterruptedException {
        ejecutar(5, false);
        ejecutar(1, false);
        ejecutar(5, true);
    }
}`
      }
    ]
  },
  17: {
    explanation: 'Cuenta, lógica de transferencia y programa principal se separan. Los monitores se adquieren por identificador creciente; se prueban transferencias en sentidos opuestos y una ejecución interrumpida entre operaciones.',
    files: [
      {
        filename: 'Cuenta.java',
        code: `public class Cuenta {
    private final int id;
    private int saldo = 1000;

    public Cuenta(int id) {
        this.id = id;
    }

    public int getId() { return id; }
    public synchronized int getSaldo() { return saldo; }
    synchronized boolean tieneSaldo(int cantidad) { return saldo >= cantidad; }
    synchronized void retirar(int cantidad) { saldo -= cantidad; }
    synchronized void ingresar(int cantidad) { saldo += cantidad; }
}`
      },
      {
        filename: 'Transferencias.java',
        code: `public class Transferencias {
    public static boolean transferir(Cuenta origen, Cuenta destino, int cantidad) {
        if (origen == destino || cantidad <= 0) return false;
        Cuenta primera = origen.getId() < destino.getId() ? origen : destino;
        Cuenta segunda = origen.getId() < destino.getId() ? destino : origen;

        synchronized (primera) {
            synchronized (segunda) {
                if (!origen.tieneSaldo(cantidad)) return false;
                origen.retirar(cantidad);
                destino.ingresar(cantidad);
                return true;
            }
        }
    }
}`
      },
      {
        filename: 'Main.java',
        code: `import java.util.Random;

public class Main {
    private static void ejecutar(boolean cancelar) throws InterruptedException {
        Cuenta[] cuentas = {new Cuenta(1), new Cuenta(2), new Cuenta(3)};
        Thread[] hilos = new Thread[3];
        for (int indice = 0; indice < hilos.length; indice++) {
            final int trabajador = indice;
            hilos[indice] = new Thread(() -> {
                Random random = new Random(100 + trabajador);
                int aceptadas = 0;
                int rechazadas = 0;
                for (int operacion = 0; operacion < 1000; operacion++) {
                    if (Thread.currentThread().isInterrupted()) break;
                    Cuenta origen = trabajador == 0 ? cuentas[0] : cuentas[1];
                    Cuenta destino = trabajador == 0 ? cuentas[1] : cuentas[0];
                    if (trabajador == 2) {
                        origen = cuentas[random.nextInt(3)];
                        destino = cuentas[(origen.getId() + random.nextInt(2)) % 3];
                    }
                    int cantidad = random.nextInt(100) + 1;
                    if (Transferencias.transferir(origen, destino, cantidad)) aceptadas++;
                    else rechazadas++;
                    if (cancelar && operacion % 25 == 0) {
                        try { Thread.sleep(1); }
                        catch (InterruptedException e) { Thread.currentThread().interrupt(); break; }
                    }
                }
                System.out.println(Thread.currentThread().getName() + " aceptadas=" + aceptadas + ", rechazadas=" + rechazadas);
            }, "Transferencias-" + (indice + 1));
            hilos[indice].start();
        }
        if (cancelar) {
            Thread.sleep(5);
            for (Thread hilo : hilos) hilo.interrupt();
        }
        for (Thread hilo : hilos) hilo.join();
        int total = 0;
        for (Cuenta cuenta : cuentas) {
            System.out.println("Cuenta " + cuenta.getId() + ": " + cuenta.getSaldo());
            total += cuenta.getSaldo();
        }
        System.out.println("Total de saldos: " + total);
    }

    public static void main(String[] args) throws InterruptedException {
        Cuenta prueba = new Cuenta(9);
        System.out.println("Origen igual a destino rechazado: " + !Transferencias.transferir(prueba, prueba, 10));
        System.out.println("Importe no positivo rechazado: " + !Transferencias.transferir(prueba, new Cuenta(10), 0));
        ejecutar(false);
        ejecutar(true);
    }
}`
      }
    ]
  },
  18: {
    explanation: 'La barrera se reutiliza en tres fases. Se ejecuta una ronda normal y otra que interrumpe a un trabajador; cancelar() avisa a los que estén esperando para que todos terminen.',
    files: [
      {
        filename: 'Ejercicio18.java',
        code: `public class Ejercicio18 {
    static class Barrera {
        private final int participantes;
        private int llegadas;
        private int generacion;
        private boolean cancelada;

        Barrera(int participantes) { this.participantes = participantes; }

        synchronized boolean esperar() throws InterruptedException {
            if (cancelada) return false;
            int miGeneracion = generacion;
            llegadas++;
            if (llegadas == participantes) {
                llegadas = 0;
                generacion++;
                notifyAll();
                return true;
            }
            while (!cancelada && generacion == miGeneracion) wait();
            return !cancelada;
        }

        synchronized void cancelar() {
            cancelada = true;
            notifyAll();
        }
    }

    private static void ejecutar(boolean cancelar) throws InterruptedException {
        Barrera barrera = new Barrera(4);
        Thread[] hilos = new Thread[4];
        for (int indice = 0; indice < hilos.length; indice++) {
            hilos[indice] = new Thread(() -> {
                try {
                    for (int fase = 1; fase <= 3; fase++) {
                        System.out.println("Inicio fase " + fase + " - " + Thread.currentThread().getName());
                        Thread.sleep(100);
                        System.out.println("Fin fase " + fase + " - " + Thread.currentThread().getName());
                        if (!barrera.esperar()) return;
                    }
                } catch (InterruptedException e) {
                    barrera.cancelar();
                    Thread.currentThread().interrupt();
                }
            }, "Trabajador-" + (indice + 1));
            hilos[indice].start();
        }
        if (cancelar) {
            Thread.sleep(50);
            hilos[0].interrupt();
        }
        for (Thread hilo : hilos) hilo.join();
    }

    public static void main(String[] args) throws InterruptedException {
        ejecutar(false);
        ejecutar(true);
    }
}`
      }
    ]
  },
  19: {
    explanation: 'El cierre normal termina las tareas aceptadas; cancelarAhora() retira pendientes y después interrumpe trabajadores. El método enviar decide aceptación bajo el mismo monitor que cerrar, por lo que un cierre concurrente no deja envíos ambiguos.',
    files: [
      {
        filename: 'Servicio.java',
        code: `import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.List;
import java.util.Queue;

public class Servicio {
    private final Queue<Integer> cola = new ArrayDeque<>();
    private final List<Integer> aceptadas = new ArrayList<>();
    private final List<Integer> retiradasAlCancelar = new ArrayList<>();
    private final List<Trabajador> trabajadores = new ArrayList<>();
    private boolean cerrado;

    public Servicio(int cantidadTrabajadores) {
        for (int indice = 1; indice <= cantidadTrabajadores; indice++) {
            Trabajador trabajador = new Trabajador(this, "Pool-" + indice);
            trabajadores.add(trabajador);
            trabajador.start();
        }
    }

    public synchronized boolean enviar(int id) throws InterruptedException {
        while (cola.size() == 4 && !cerrado) wait();
        if (cerrado) return false;
        cola.add(id);
        aceptadas.add(id);
        notifyAll();
        return true;
    }

    synchronized Integer tomar() throws InterruptedException {
        while (cola.isEmpty() && !cerrado) wait();
        if (cola.isEmpty()) return null;
        int tarea = cola.remove();
        notifyAll();
        return tarea;
    }

    public synchronized void cerrar() {
        cerrado = true;
        notifyAll();
    }

    public void cancelarAhora() {
        synchronized (this) {
            cerrado = true;
            retiradasAlCancelar.addAll(cola);
            cola.clear();
            notifyAll();
        }
        for (Trabajador trabajador : trabajadores) trabajador.interrupt();
    }

    public void esperarFin() throws InterruptedException {
        for (Trabajador trabajador : trabajadores) trabajador.join();
    }

    public synchronized List<Integer> aceptadas() { return new ArrayList<>(aceptadas); }
    public synchronized List<Integer> retiradasAlCancelar() { return new ArrayList<>(retiradasAlCancelar); }
    public synchronized List<Integer> completadas() {
        List<Integer> resultado = new ArrayList<>();
        for (Trabajador trabajador : trabajadores) resultado.addAll(trabajador.completadas());
        return resultado;
    }
    public synchronized List<Integer> canceladasDuranteEjecucion() {
        List<Integer> resultado = new ArrayList<>();
        for (Trabajador trabajador : trabajadores) resultado.addAll(trabajador.canceladas());
        return resultado;
    }
}`
      },
      {
        filename: 'Trabajador.java',
        code: `import java.util.ArrayList;
import java.util.List;

public class Trabajador extends Thread {
    private final Servicio servicio;
    private final List<Integer> completadas = new ArrayList<>();
    private final List<Integer> canceladas = new ArrayList<>();

    public Trabajador(Servicio servicio, String nombre) {
        super(nombre);
        this.servicio = servicio;
    }

    @Override
    public void run() {
        Integer actual = null;
        try {
            while (true) {
                actual = servicio.tomar();
                if (actual == null) return;
                Thread.sleep(250);
                completadas.add(actual);
                actual = null;
            }
        } catch (InterruptedException e) {
            if (actual != null) canceladas.add(actual);
            interrupt();
        }
    }

    List<Integer> completadas() { return new ArrayList<>(completadas); }
    List<Integer> canceladas() { return new ArrayList<>(canceladas); }
}`
      },
      {
        filename: 'Main.java',
        code: `import java.util.concurrent.CountDownLatch;

public class Main {
    private static void cierreNormal() throws InterruptedException {
        Servicio servicio = new Servicio(3);
        for (int id = 1; id <= 12; id++) servicio.enviar(id);
        servicio.cerrar();
        servicio.esperarFin();
        System.out.println("Completadas: " + servicio.completadas());
    }

    private static void cancelarConPendientes() throws InterruptedException {
        Servicio servicio = new Servicio(3);
        for (int id = 1; id <= 12; id++) servicio.enviar(id);
        Thread.sleep(100);
        servicio.cancelarAhora();
        servicio.esperarFin();
        System.out.println("Aceptadas: " + servicio.aceptadas());
        System.out.println("Completadas: " + servicio.completadas());
        System.out.println("Canceladas en ejecución: " + servicio.canceladasDuranteEjecucion());
        System.out.println("Retiradas de la cola: " + servicio.retiradasAlCancelar());
    }

    private static void cierreMientrasSeEnvia() throws InterruptedException {
        Servicio servicio = new Servicio(0);
        for (int id = 1; id <= 4; id++) servicio.enviar(id);
        CountDownLatch iniciandoEnvio = new CountDownLatch(1);
        Thread emisor = new Thread(() -> {
            try {
                iniciandoEnvio.countDown();
                System.out.println("Envío aceptado: " + servicio.enviar(5));
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });
        emisor.start();
        iniciandoEnvio.await();
        servicio.cerrar();
        emisor.join();
        servicio.esperarFin();
    }

    public static void main(String[] args) throws InterruptedException {
        cierreNormal();
        cancelarConPendientes();
        cierreMientrasSeEnvia();
    }
}`
      }
    ]
  },
  20: {
    explanation: 'La reserva es atómica respecto a ambos recursos y la bandera reservado controla la devolución en finally. Se ejecuta una prueba normal y otra que interrumpe a todos los equipos.',
    files: [
      {
        filename: 'Ejercicio20.java',
        code: `public class Ejercicio20 {
    static class Recursos {
        private int camaras = 2;
        private int microfonos = 3;

        synchronized void reservar() throws InterruptedException {
            while (camaras == 0 || microfonos == 0) wait();
            camaras--;
            microfonos--;
        }

        synchronized void devolver() {
            camaras++;
            microfonos++;
            notifyAll();
        }

        synchronized String estado() {
            return "cámaras=" + camaras + ", micrófonos=" + microfonos;
        }
    }

    static class Equipo extends Thread {
        private final Recursos recursos;
        private int completadas;

        Equipo(Recursos recursos, int numero) {
            super("Equipo-" + numero);
            this.recursos = recursos;
        }

        @Override
        public void run() {
            for (int intento = 0; intento < 3; intento++) {
                if (isInterrupted()) return;
                boolean reservado = false;
                try {
                    recursos.reservar();
                    reservado = true;
                    Thread.sleep(300);
                    completadas++;
                    System.out.println(getName() + " completó una grabación");
                } catch (InterruptedException e) {
                    interrupt();
                    return;
                } finally {
                    if (reservado) recursos.devolver();
                }
            }
        }

        int completadas() { return completadas; }
    }

    private static void ejecutar(boolean cancelar) throws InterruptedException {
        Recursos recursos = new Recursos();
        Equipo[] equipos = new Equipo[5];
        for (int indice = 0; indice < equipos.length; indice++) {
            equipos[indice] = new Equipo(recursos, indice + 1);
            equipos[indice].start();
        }
        if (cancelar) {
            Thread.sleep(150);
            for (Equipo equipo : equipos) equipo.interrupt();
        }
        int total = 0;
        for (Equipo equipo : equipos) {
            equipo.join();
            total += equipo.completadas();
        }
        System.out.println("Cancelación=" + cancelar + ", completadas=" + total);
        System.out.println("Disponibilidad final: " + recursos.estado());
    }

    public static void main(String[] args) throws InterruptedException {
        ejecutar(false);
        ejecutar(true);
    }
}`
      }
    ]
  }
};
