export interface ExerciseSolution {
  filename: string;
  explanation: string;
  code: string;
}

export const EXERCISE_SOLUTIONS: Record<number, ExerciseSolution> = {
  1: {
    filename: 'Ejercicio01.java',
    explanation: 'La subclase guarda la etiqueta y define el trabajo en run(). start() crea un hilo nuevo; si se quiere comparar con la ejecución secuencial, se puede sustituir por run() en main.',
    code: `public class Ejercicio01 {
    static class SaludoThread extends Thread {
        private final String etiqueta;

        SaludoThread(String etiqueta) {
            this.etiqueta = etiqueta;
        }

        @Override
        public void run() {
            for (int numero = 1; numero <= 5; numero++) {
                System.out.println(etiqueta + " saluda " + numero);
            }
        }
    }

    public static void main(String[] args) {
        Thread hiloA = new SaludoThread("A");
        Thread hiloB = new SaludoThread("B");
        hiloA.start();
        hiloB.start();
    }
}`
  },
  2: {
    filename: 'Ejercicio02.java',
    explanation: 'TareaSaludo contiene el trabajo y cada objeto Thread lo ejecuta. Cada etiqueta tiene su propia instancia Runnable.',
    code: `public class Ejercicio02 {
    static class TareaSaludo implements Runnable {
        private final String etiqueta;

        TareaSaludo(String etiqueta) {
            this.etiqueta = etiqueta;
        }

        @Override
        public void run() {
            for (int numero = 1; numero <= 5; numero++) {
                System.out.println(etiqueta + " saluda " + numero);
            }
        }
    }

    public static void main(String[] args) {
        Thread hiloA = new Thread(new TareaSaludo("A"));
        Thread hiloB = new Thread(new TareaSaludo("B"));
        hiloA.start();
        hiloB.start();
    }
}`
  },
  3: {
    filename: 'Ejercicio03.java',
    explanation: 'Los dos hilos se arrancan antes de esperar. El valor de isAlive() justo después de start() depende de cuándo se ejecute cada tarea.',
    code: `public class Ejercicio03 {
    static class Tarea implements Runnable {
        @Override
        public void run() {
            for (int numero = 1; numero <= 20; numero++) {
                System.out.println(Thread.currentThread().getName() + ": " + numero);
            }
        }
    }

    public static void main(String[] args) throws InterruptedException {
        Thread primero = new Thread(new Tarea());
        Thread segundo = new Thread(new Tarea());
        primero.setName("Trabajador1");
        segundo.setName("Trabajador2");

        System.out.println(primero.getName() + " activo: " + primero.isAlive());
        System.out.println(segundo.getName() + " activo: " + segundo.isAlive());
        primero.start();
        segundo.start();
        System.out.println(primero.getName() + " activo: " + primero.isAlive());
        System.out.println(segundo.getName() + " activo: " + segundo.isAlive());

        primero.join();
        segundo.join();
        System.out.println(primero.getName() + " activo: " + primero.isAlive());
        System.out.println(segundo.getName() + " activo: " + segundo.isAlive());
        System.out.println("Todos han terminado");
    }
}`
  },
  4: {
    filename: 'Ejercicio04.java',
    explanation: 'sleep() pausa solo al hilo que la invoca. La espera se hace entre mensajes, y la interrupción termina la tarea sin detener la otra.',
    code: `public class Ejercicio04 {
    static class TareaRitmo implements Runnable {
        private final long pausa;

        TareaRitmo(long pausa) {
            this.pausa = pausa;
        }

        @Override
        public void run() {
            String nombre = Thread.currentThread().getName();
            for (int numero = 1; numero <= 5; numero++) {
                System.out.println(nombre + " mensaje " + numero);
                if (numero < 5) {
                    try {
                        Thread.sleep(pausa);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                        return;
                    }
                }
            }
        }
    }

    public static void main(String[] args) throws InterruptedException {
        Thread rapido = new Thread(new TareaRitmo(200), "Ritmo-200ms");
        Thread lento = new Thread(new TareaRitmo(400), "Ritmo-400ms");
        rapido.start();
        lento.start();
        rapido.join();
        lento.join();
        System.out.println("Ambos hilos terminaron");
    }
}`
  },
  5: {
    filename: 'Ejercicio05.java',
    explanation: 'Los cuatro hilos comparten una única instancia de Contador. Esta versión deja incrementar() sin protección para observar la condición de carrera; un valor menor puede aparecer, pero no está garantizado.',
    code: `public class Ejercicio05 {
    static class Contador {
        private int valor;

        void incrementar() {
            valor++;
        }

        int consultar() {
            return valor;
        }
    }

    public static void main(String[] args) throws InterruptedException {
        Contador contador = new Contador();
        Thread[] hilos = new Thread[4];

        for (int indice = 0; indice < hilos.length; indice++) {
            hilos[indice] = new Thread(() -> {
                for (int vuelta = 0; vuelta < 100_000; vuelta++) {
                    contador.incrementar();
                }
            });
            hilos[indice].start();
        }

        for (Thread hilo : hilos) {
            hilo.join();
        }
        System.out.println("Resultado: " + contador.consultar());
        System.out.println("Máximo esperado: 400000");
    }
}`
  },
  6: {
    filename: 'Ejercicio06.java',
    explanation: 'El mismo objeto protege ambas variantes. Ejecuta primero el método synchronized y después el bloque synchronized; ambos deben terminar en 400000.',
    code: `public class Ejercicio06 {
    static class Contador {
        private int valor;

        synchronized void incrementar() {
            valor++;
        }

        void incrementarConBloque() {
            synchronized (this) {
                valor++;
            }
        }

        synchronized int consultar() {
            return valor;
        }
    }

    static int ejecutarPrueba(boolean usarBloque) throws InterruptedException {
        Contador contador = new Contador();
        Thread[] hilos = new Thread[4];
        for (int indice = 0; indice < hilos.length; indice++) {
            hilos[indice] = new Thread(() -> {
                for (int vuelta = 0; vuelta < 100_000; vuelta++) {
                    if (usarBloque) {
                        contador.incrementarConBloque();
                    } else {
                        contador.incrementar();
                    }
                }
            });
            hilos[indice].start();
        }
        for (Thread hilo : hilos) {
            hilo.join();
        }
        return contador.consultar();
    }

    public static void main(String[] args) throws InterruptedException {
        System.out.println("Método synchronized: " + ejecutarPrueba(false));
        System.out.println("Bloque synchronized: " + ejecutarPrueba(true));
    }
}`
  },
  7: {
    filename: 'Ejercicio07.java',
    explanation: 'interrupt() es una petición cooperativa. Si sleep() la recibe, InterruptedException limpia la marca; por eso el trabajador la restaura antes de salir.',
    code: `public class Ejercicio07 {
    public static void main(String[] args) throws InterruptedException {
        Thread trabajador = new Thread(() -> {
            while (!Thread.currentThread().isInterrupted()) {
                System.out.println("Trabajando...");
                try {
                    Thread.sleep(200);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
            System.out.println("Fin del trabajador");
        });

        trabajador.start();
        Thread.sleep(1000);
        trabajador.interrupt();
        trabajador.join();
        System.out.println("Trabajador terminado");
    }
}`
  },
  8: {
    filename: 'Ejercicio08.java',
    explanation: 'wait(200) se ejecuta con el monitor adquirido y lo libera durante la espera. El while vuelve a comprobar la condición al despertar.',
    code: `public class Ejercicio08 {
    static class Puerta {
        private boolean abierta;

        synchronized void esperarPaso() throws InterruptedException {
            while (!abierta) {
                wait(200);
            }
            System.out.println("Paso permitido");
        }

        synchronized void abrir() {
            abierta = true;
        }
    }

    public static void main(String[] args) throws InterruptedException {
        Puerta puerta = new Puerta();
        Thread visitante = new Thread(() -> {
            try {
                puerta.esperarPaso();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });
        Thread encargado = new Thread(() -> {
            try {
                Thread.sleep(600);
                puerta.abrir();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });

        visitante.start();
        encargado.start();
        visitante.join();
        encargado.join();
    }
}`
  },
  9: {
    filename: 'Ejercicio09.java',
    explanation: 'La puerta conserva el estado. Si ya está abierta antes de que el visitante arranque, este no espera una notificación pasada: comprueba abierta y continúa.',
    code: `public class Ejercicio09 {
    static class Puerta {
        private boolean abierta;

        synchronized void esperarPaso() throws InterruptedException {
            while (!abierta) {
                wait();
            }
            System.out.println("Paso permitido");
        }

        synchronized void abrir() {
            abierta = true;
            notify();
        }
    }

    static void probar(boolean abrirAntes) throws InterruptedException {
        Puerta puerta = new Puerta();
        Thread visitante = new Thread(() -> {
            try {
                puerta.esperarPaso();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });
        Thread encargado = new Thread(puerta::abrir);

        if (abrirAntes) {
            encargado.start();
            encargado.join();
            visitante.start();
        } else {
            visitante.start();
            encargado.start();
        }
        visitante.join();
        encargado.join();
    }

    public static void main(String[] args) throws InterruptedException {
        probar(false);
        probar(true);
    }
}`
  },
  10: {
    filename: 'Ejercicio10.java',
    explanation: 'notifyAll() despierta a todos los que esperan. La condición abierta se guarda en el objeto, por lo que también funciona si se abre antes de iniciar los visitantes.',
    code: `public class Ejercicio10 {
    static class Puerta {
        private boolean abierta;

        synchronized void esperarPaso() throws InterruptedException {
            while (!abierta) {
                wait();
            }
            System.out.println(Thread.currentThread().getName() + " pasa");
        }

        synchronized void abrir() {
            abierta = true;
            notifyAll();
        }
    }

    public static void main(String[] args) throws InterruptedException {
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
            visitantes[indice].start();
        }

        Thread.sleep(200);
        puerta.abrir();
        for (Thread visitante : visitantes) {
            visitante.join();
        }
    }
}`
  },
  11: {
    filename: 'Ejercicio11.java',
    explanation: 'La disponibilidad y la asignación del siguiente número ocurren en una única sección sincronizada. Las listas de ventas son propias de cada vendedor.',
    code: `import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class Ejercicio11 {
    static class Inventario {
        private int siguiente = 1;
        private final int total;

        Inventario(int total) {
            this.total = total;
        }

        synchronized int vender() {
            if (siguiente > total) {
                return -1;
            }
            return siguiente++;
        }
    }

    static class Vendedor implements Runnable {
        private final Inventario inventario;
        private final List<Integer> vendidas = new ArrayList<>();

        Vendedor(Inventario inventario) {
            this.inventario = inventario;
        }

        @Override
        public void run() {
            int entrada;
            while ((entrada = inventario.vender()) != -1) {
                vendidas.add(entrada);
            }
        }

        List<Integer> vendidas() {
            return vendidas;
        }
    }

    public static void main(String[] args) throws InterruptedException {
        Inventario inventario = new Inventario(20);
        Vendedor[] vendedores = {
            new Vendedor(inventario), new Vendedor(inventario), new Vendedor(inventario)
        };
        Thread[] hilos = new Thread[vendedores.length];
        for (int indice = 0; indice < vendedores.length; indice++) {
            hilos[indice] = new Thread(vendedores[indice], "Vendedor-" + (indice + 1));
            hilos[indice].start();
        }
        for (Thread hilo : hilos) {
            hilo.join();
        }

        List<Integer> todas = new ArrayList<>();
        for (int indice = 0; indice < vendedores.length; indice++) {
            System.out.println("Vendedor " + (indice + 1) + ": " + vendedores[indice].vendidas());
            todas.addAll(vendedores[indice].vendidas());
        }
        Collections.sort(todas);
        System.out.println("Entradas vendidas: " + todas);
        System.out.println("Total: " + todas.size());
    }
}`
  },
  12: {
    filename: 'Ejercicio12.java',
    explanation: 'El buzón usa un booleano para distinguir un dato pendiente de un buzón vacío. Los dos métodos esperan con while y avisan después de cambiar el estado.',
    code: `public class Ejercicio12 {
    static class Buzon {
        private int dato;
        private boolean lleno;

        synchronized void poner(int valor) throws InterruptedException {
            while (lleno) {
                wait();
            }
            dato = valor;
            lleno = true;
            notifyAll();
        }

        synchronized int recoger() throws InterruptedException {
            while (!lleno) {
                wait();
            }
            int valor = dato;
            lleno = false;
            notifyAll();
            return valor;
        }
    }

    public static void main(String[] args) throws InterruptedException {
        Buzon buzon = new Buzon();
        Thread productor = new Thread(() -> {
            try {
                for (int numero = 1; numero <= 10; numero++) {
                    buzon.poner(numero);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });
        Thread consumidor = new Thread(() -> {
            try {
                for (int cuenta = 0; cuenta < 10; cuenta++) {
                    System.out.println("Recibido: " + buzon.recoger());
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });

        productor.start();
        consumidor.start();
        productor.join();
        consumidor.join();
    }
}`
  },
  13: {
    filename: 'Ejercicio13.java',
    explanation: 'La salida se guarda como estado antes de notificar. Un corredor que se registra tarde ve salidaDada en true y no depende de recibir un aviso anterior.',
    code: `public class Ejercicio13 {
    static class Salida {
        private boolean dada;

        synchronized void esperar() throws InterruptedException {
            while (!dada) {
                wait();
            }
        }

        synchronized void dar() {
            System.out.println("Salida");
            dada = true;
            notifyAll();
        }
    }

    static class Arbitro extends Thread {
        private final Salida salida;

        Arbitro(Salida salida) {
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
            }
        }
    }

    public static void main(String[] args) throws InterruptedException {
        Salida salida = new Salida();
        Arbitro arbitro = new Arbitro(salida);
        Thread[] corredores = new Thread[4];
        for (int indice = 0; indice < corredores.length; indice++) {
            corredores[indice] = new Thread(() -> {
                try {
                    salida.esperar();
                    for (int paso = 1; paso <= 3; paso++) {
                        System.out.println(Thread.currentThread().getName() + " paso " + paso);
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }, "Corredor-" + (indice + 1));
            corredores[indice].start();
        }
        arbitro.start();
        arbitro.join();
        for (Thread corredor : corredores) {
            corredor.join();
        }
    }
}`
  },
  14: {
    filename: 'Ejercicio14.java',
    explanation: 'El trabajador conserva el identificador que ya retiró para distinguir una tarea cancelada durante sleep() de las que siguen en la cola. Todas las listas se consultan después de join().',
    code: `import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.List;
import java.util.Queue;

public class Ejercicio14 {
    static class ColaEncargos {
        private final Queue<Integer> cola = new ArrayDeque<>();

        synchronized void anadir(int encargo) {
            cola.add(encargo);
            notifyAll();
        }

        synchronized int extraer() throws InterruptedException {
            while (cola.isEmpty()) {
                wait();
            }
            return cola.remove();
        }

        synchronized List<Integer> pendientes() {
            return new ArrayList<>(cola);
        }
    }

    public static void main(String[] args) throws InterruptedException {
        ColaEncargos cola = new ColaEncargos();
        List<Integer> completados = new ArrayList<>();
        List<Integer> cancelados = new ArrayList<>();
        Thread trabajador = new Thread(() -> {
            int actual = -1;
            try {
                while (!Thread.currentThread().isInterrupted()) {
                    actual = cola.extraer();
                    Thread.sleep(300);
                    completados.add(actual);
                    actual = -1;
                }
            } catch (InterruptedException e) {
                if (actual != -1) {
                    cancelados.add(actual);
                }
                Thread.currentThread().interrupt();
            }
        });

        trabajador.start();
        for (int encargo = 1; encargo <= 5; encargo++) {
            cola.anadir(encargo);
        }
        Thread.sleep(500);
        trabajador.interrupt();
        trabajador.join();

        System.out.println("Completados: " + completados);
        System.out.println("Retirado y cancelado: " + cancelados);
        System.out.println("Pendientes: " + cola.pendientes());
    }
}`
  },
  15: {
    filename: 'Ejercicio15.java',
    explanation: 'La impresión, el cambio de turno y notifyAll() forman una sola sección sincronizada. El estado cancelado permite que ambos participantes abandonen la espera.',
    code: `public class Ejercicio15 {
    static class Turnos {
        private char turno = 'A';
        private boolean cancelado;

        synchronized boolean imprimirSiToca(char letra) throws InterruptedException {
            while (!cancelado && turno != letra) {
                wait();
            }
            if (cancelado) {
                return false;
            }
            System.out.print(letra);
            turno = letra == 'A' ? 'B' : 'A';
            notifyAll();
            return true;
        }

        synchronized void cancelar() {
            cancelado = true;
            notifyAll();
        }
    }

    static class Impresor implements Runnable {
        private final Turnos turnos;
        private final char letra;

        Impresor(Turnos turnos, char letra) {
            this.turnos = turnos;
            this.letra = letra;
        }

        @Override
        public void run() {
            try {
                for (int cuenta = 0; cuenta < 5; cuenta++) {
                    if (!turnos.imprimirSiToca(letra)) {
                        return;
                    }
                }
            } catch (InterruptedException e) {
                turnos.cancelar();
                Thread.currentThread().interrupt();
            }
        }
    }

    public static void main(String[] args) throws InterruptedException {
        Turnos turnos = new Turnos();
        Thread hiloA = new Thread(new Impresor(turnos, 'A'));
        Thread hiloB = new Thread(new Impresor(turnos, 'B'));
        hiloA.start();
        hiloB.start();
        hiloA.join();
        hiloB.join();
        System.out.println();
    }
}`
  },
  16: {
    filename: 'Ejercicio16.java',
    explanation: 'La cola acotada protege ocupación y datos con el mismo monitor. Cada productor reduce el contador activo desde finally, para que los consumidores sepan cuándo no habrá más elementos.',
    code: `import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.List;
import java.util.Queue;

public class Ejercicio16 {
    static class Almacen {
        private final Queue<String> cola = new ArrayDeque<>();
        private final int capacidad;
        private int productoresActivos = 2;
        private final List<String> retirados = new ArrayList<>();

        Almacen(int capacidad) {
            this.capacidad = capacidad;
        }

        synchronized void poner(String dato) throws InterruptedException {
            while (cola.size() == capacidad) {
                wait();
            }
            cola.add(dato);
            notifyAll();
        }

        synchronized String retirar() throws InterruptedException {
            while (cola.isEmpty() && productoresActivos > 0) {
                wait();
            }
            if (cola.isEmpty()) {
                return null;
            }
            String dato = cola.remove();
            retirados.add(dato);
            notifyAll();
            return dato;
        }

        synchronized void productorTerminado() {
            productoresActivos--;
            notifyAll();
        }

        synchronized List<String> retirados() {
            return new ArrayList<>(retirados);
        }
    }

    public static void main(String[] args) throws InterruptedException {
        Almacen almacen = new Almacen(5);
        Thread[] productores = new Thread[2];
        Thread[] consumidores = new Thread[3];

        for (int p = 0; p < productores.length; p++) {
            String nombre = "P" + (p + 1);
            productores[p] = new Thread(() -> {
                try {
                    for (int numero = 1; numero <= 10; numero++) {
                        almacen.poner(nombre + "-" + numero);
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                } finally {
                    almacen.productorTerminado();
                }
            });
        }

        for (int c = 0; c < consumidores.length; c++) {
            consumidores[c] = new Thread(() -> {
                try {
                    while (almacen.retirar() != null) {
                        Thread.yield();
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            });
        }

        for (Thread productor : productores) productor.start();
        for (Thread consumidor : consumidores) consumidor.start();
        for (Thread productor : productores) productor.join();
        for (Thread consumidor : consumidores) consumidor.join();
        System.out.println("Identificadores retirados: " + almacen.retirados().size());
        System.out.println(almacen.retirados());
    }
}`
  },
  17: {
    filename: 'Ejercicio17.java',
    explanation: 'Las dos cuentas se bloquean en orden de identificador, no en el sentido del movimiento. El cuerpo de una transferencia se completa antes de que el hilo compruebe su interrupción.',
    code: `import java.util.Random;

public class Ejercicio17 {
    static class Cuenta {
        final int id;
        private int saldo = 1000;

        Cuenta(int id) {
            this.id = id;
        }

        int saldo() {
            return saldo;
        }
    }

    static boolean transferir(Cuenta origen, Cuenta destino, int cantidad) {
        if (origen == destino || cantidad <= 0) {
            return false;
        }
        Cuenta primera = origen.id < destino.id ? origen : destino;
        Cuenta segunda = origen.id < destino.id ? destino : origen;

        synchronized (primera) {
            synchronized (segunda) {
                if (origen.saldo < cantidad) {
                    return false;
                }
                origen.saldo -= cantidad;
                destino.saldo += cantidad;
                return true;
            }
        }
    }

    public static void main(String[] args) throws InterruptedException {
        Cuenta[] cuentas = {new Cuenta(1), new Cuenta(2), new Cuenta(3)};
        Thread[] trabajadores = new Thread[3];
        for (int t = 0; t < trabajadores.length; t++) {
            final int semilla = 100 + t;
            trabajadores[t] = new Thread(() -> {
                Random random = new Random(semilla);
                int aceptadas = 0;
                int rechazadas = 0;
                for (int operacion = 0; operacion < 1000; operacion++) {
                    if (Thread.currentThread().isInterrupted()) break;
                    int desde = random.nextInt(3);
                    int hasta = (desde + 1 + random.nextInt(2)) % 3;
                    boolean correcta = transferir(cuentas[desde], cuentas[hasta], random.nextInt(100) + 1);
                    if (correcta) aceptadas++; else rechazadas++;
                }
                System.out.println(Thread.currentThread().getName() + " aceptadas=" + aceptadas + " rechazadas=" + rechazadas);
            }, "Transferencias-" + (t + 1));
            trabajadores[t].start();
        }
        for (Thread trabajador : trabajadores) trabajador.join();

        int total = 0;
        for (Cuenta cuenta : cuentas) {
            System.out.println("Cuenta " + cuenta.id + ": " + cuenta.saldo());
            total += cuenta.saldo();
        }
        System.out.println("Saldo total: " + total);
    }
}`
  },
  18: {
    filename: 'Ejercicio18.java',
    explanation: 'La generación diferencia una reunión de la siguiente. La cancelación cambia el estado bajo el mismo monitor y despierta a quienes esperan.',
    code: `public class Ejercicio18 {
    static class Barrera {
        private final int participantes;
        private int llegadas;
        private int generacion;
        private boolean cancelada;

        Barrera(int participantes) {
            this.participantes = participantes;
        }

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
            while (!cancelada && miGeneracion == generacion) {
                wait();
            }
            return !cancelada;
        }

        synchronized void cancelar() {
            cancelada = true;
            notifyAll();
        }
    }

    public static void main(String[] args) throws InterruptedException {
        Barrera barrera = new Barrera(4);
        Thread[] trabajadores = new Thread[4];
        for (int t = 0; t < trabajadores.length; t++) {
            trabajadores[t] = new Thread(() -> {
                try {
                    for (int fase = 1; fase <= 3; fase++) {
                        System.out.println("Inicio fase " + fase + " - " + Thread.currentThread().getName());
                        Thread.sleep(100 + (long) (Math.random() * 200));
                        System.out.println("Fin fase " + fase + " - " + Thread.currentThread().getName());
                        if (!barrera.esperar()) return;
                    }
                } catch (InterruptedException e) {
                    barrera.cancelar();
                    Thread.currentThread().interrupt();
                }
            }, "Trabajador-" + (t + 1));
            trabajadores[t].start();
        }
        for (Thread trabajador : trabajadores) trabajador.join();
    }
}`
  },
  19: {
    filename: 'Ejercicio19.java',
    explanation: 'La decisión de aceptar una tarea ocurre dentro del monitor que también cierra el servicio. cerrar() deja terminar lo aceptado; cancelarAhora() registra y retira pendientes, y después interrumpe a los trabajadores.',
    code: `import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.List;
import java.util.Queue;

public class Ejercicio19 {
    static class Servicio {
        private final Queue<Integer> cola = new ArrayDeque<>();
        private final List<Trabajador> trabajadores = new ArrayList<>();
        private final List<Integer> retiradasPorCancelacion = new ArrayList<>();
        private boolean cerrado;

        Servicio(int numeroTrabajadores) {
            for (int i = 1; i <= numeroTrabajadores; i++) {
                Trabajador trabajador = new Trabajador(this, "Pool-" + i);
                trabajadores.add(trabajador);
                trabajador.start();
            }
        }

        synchronized boolean enviar(int tarea) throws InterruptedException {
            while (cola.size() == 4 && !cerrado) wait();
            if (cerrado) return false;
            cola.add(tarea);
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

        synchronized void cerrar() {
            cerrado = true;
            notifyAll();
        }

        List<Integer> cancelarAhora() {
            List<Integer> pendientes;
            synchronized (this) {
                cerrado = true;
                pendientes = new ArrayList<>(cola);
                retiradasPorCancelacion.addAll(pendientes);
                cola.clear();
                notifyAll();
            }
            for (Trabajador trabajador : trabajadores) trabajador.interrupt();
            return pendientes;
        }

        void esperarFin() throws InterruptedException {
            for (Trabajador trabajador : trabajadores) trabajador.join();
        }

        List<Integer> retiradasPorCancelacion() {
            return new ArrayList<>(retiradasPorCancelacion);
        }
    }

    static class Trabajador extends Thread {
        private final Servicio servicio;
        private final List<Integer> completadas = new ArrayList<>();
        private final List<Integer> canceladas = new ArrayList<>();

        Trabajador(Servicio servicio, String nombre) {
            super(nombre);
            this.servicio = servicio;
        }

        @Override
        public void run() {
            Integer tarea = null;
            try {
                while (true) {
                    tarea = servicio.tomar();
                    if (tarea == null) return;
                    Thread.sleep(250);
                    completadas.add(tarea);
                    tarea = null;
                }
            } catch (InterruptedException e) {
                if (tarea != null) canceladas.add(tarea);
                Thread.currentThread().interrupt();
            }
        }
    }

    public static void main(String[] args) throws InterruptedException {
        Servicio servicio = new Servicio(3);
        for (int tarea = 1; tarea <= 12; tarea++) {
            if (!servicio.enviar(tarea)) System.out.println("Rechazada: " + tarea);
        }
        servicio.cerrar();
        servicio.esperarFin();
        System.out.println("Servicio cerrado; los trabajadores han terminado.");
    }
}`
  },
  20: {
    filename: 'Ejercicio20.java',
    explanation: 'La reserva descuenta cámara y micrófono dentro de una única sección sincronizada. La variable reservada evita devolver recursos si el equipo fue interrumpido mientras esperaba.',
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

        synchronized void mostrarDisponibilidad() {
            System.out.println("Cámaras=" + camaras + ", micrófonos=" + microfonos);
        }
    }

    static class Equipo extends Thread {
        private final Recursos recursos;
        private int grabacionesCompletadas;

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
                    grabacionesCompletadas++;
                    System.out.println(getName() + " completó una grabación");
                } catch (InterruptedException e) {
                    interrupt();
                    return;
                } finally {
                    if (reservado) recursos.devolver();
                }
            }
        }
    }

    public static void main(String[] args) throws InterruptedException {
        Recursos recursos = new Recursos();
        Equipo[] equipos = new Equipo[5];
        for (int indice = 0; indice < equipos.length; indice++) {
            equipos[indice] = new Equipo(recursos, indice + 1);
            equipos[indice].start();
        }
        for (Equipo equipo : equipos) equipo.join();
        recursos.mostrarDisponibilidad();
    }
}`
  }
};
