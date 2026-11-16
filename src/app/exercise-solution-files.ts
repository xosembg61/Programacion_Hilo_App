export interface ExerciseSourceFile {
  filename: string;
  code: string;
}

export const MULTI_FILE_SOLUTIONS: Record<number, ExerciseSourceFile[]> = {
  1: [
    {
      filename: 'SaludoThread.java',
      code: `public class SaludoThread extends Thread {
    private final String etiqueta;

    public SaludoThread(String etiqueta) {
        this.etiqueta = etiqueta;
    }

    @Override
    public void run() {
        for (int numero = 1; numero <= 5; numero++) {
            System.out.println(etiqueta + " saluda " + numero);
        }
    }
}`
    },
    {
      filename: 'Main.java',
      code: `public class Main {
    public static void main(String[] args) {
        SaludoThread hiloA = new SaludoThread("A");
        SaludoThread hiloB = new SaludoThread("B");
        hiloA.start();
        hiloB.start();
    }
}`
    }
  ],
  2: [
    {
      filename: 'TareaSaludo.java',
      code: `public class TareaSaludo implements Runnable {
    private final String etiqueta;

    public TareaSaludo(String etiqueta) {
        this.etiqueta = etiqueta;
    }

    @Override
    public void run() {
        for (int numero = 1; numero <= 5; numero++) {
            System.out.println(etiqueta + " saluda " + numero);
        }
    }
}`
    },
    {
      filename: 'Main.java',
      code: `public class Main {
    public static void main(String[] args) {
        TareaSaludo tareaA = new TareaSaludo("A");
        TareaSaludo tareaB = new TareaSaludo("B");
        Thread hiloA = new Thread(tareaA, "Hilo-A");
        Thread hiloB = new Thread(tareaB, "Hilo-B");
        hiloA.start();
        hiloB.start();
    }
}`
    }
  ],
  3: [
    {
      filename: 'Trabajador.java',
      code: `public class Trabajador implements Runnable {
    @Override
    public void run() {
        for (int numero = 1; numero <= 20; numero++) {
            System.out.println(Thread.currentThread().getName() + ": " + numero);
        }
    }
}`
    },
    {
      filename: 'Main.java',
      code: `public class Main {
    public static void main(String[] args) throws InterruptedException {
        Thread primero = new Thread(new Trabajador());
        Thread segundo = new Thread(new Trabajador());
        primero.setName("Trabajador1");
        segundo.setName("Trabajador2");

        System.out.println("Antes: " + primero.isAlive() + ", " + segundo.isAlive());
        primero.start();
        segundo.start();
        System.out.println("Tras start: " + primero.isAlive() + ", " + segundo.isAlive());
        primero.join();
        segundo.join();
        System.out.println("Después de join: " + primero.isAlive() + ", " + segundo.isAlive());
        System.out.println("Todos han terminado");
    }
}`
    }
  ],
  4: [
    {
      filename: 'HilosRotos.java',
      code: `public class HilosRotos implements Runnable {
    private final long pausa;

    public HilosRotos(long pausa) {
        this.pausa = pausa;
    }

    @Override
    public void run() {
        String nombre = Thread.currentThread().getName();
        try {
            for (int numero = 1; numero <= 5; numero++) {
                System.out.println(nombre + ": mensaje " + numero);
                if (numero < 5) {
                    Thread.sleep(pausa);
                }
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
    public static void main(String[] args) throws InterruptedException {
        Thread rapido = new Thread(new HilosRotos(200), "Ritmo-200ms");
        Thread lento = new Thread(new HilosRotos(400), "Ritmo-400ms");
        rapido.start();
        lento.start();
        rapido.join();
        lento.join();
        System.out.println("Ambos hilos terminaron");
    }
}`
    }
  ],
  5: [
    {
      filename: 'Contador.java',
      code: `public class Contador {
    private int valor;

    public void incrementar() {
        valor++;
    }

    public int getValor() {
        return valor;
    }
}`
    },
    {
      filename: 'Tareas.java',
      code: `public class Tareas implements Runnable {
    private final Contador contador;

    public Tareas(Contador contador) {
        this.contador = contador;
    }

    @Override
    public void run() {
        for (int vuelta = 0; vuelta < 100_000; vuelta++) {
            contador.incrementar();
        }
    }
}`
    },
    {
      filename: 'Main.java',
      code: `public class Main {
    public static void main(String[] args) throws InterruptedException {
        Contador contador = new Contador();
        Thread[] hilos = new Thread[4];

        for (int indice = 0; indice < hilos.length; indice++) {
            hilos[indice] = new Thread(new Tareas(contador));
            hilos[indice].start();
        }
        for (Thread hilo : hilos) {
            hilo.join();
        }
        System.out.println("Resultado: " + contador.getValor());
        System.out.println("Resultado máximo esperado: 400000");
    }
}`
    }
  ],
  6: [
    {
      filename: 'Contador.java',
      code: `public class Contador {
    private int valor;

    public synchronized void incrementar() {
        valor++;
    }

    public void incrementarConBloque() {
        synchronized (this) {
            valor++;
        }
    }

    public synchronized int getValor() {
        return valor;
    }
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
            if (usarBloque) {
                contador.incrementarConBloque();
            } else {
                contador.incrementar();
            }
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
        for (Thread hilo : hilos) {
            hilo.join();
        }
        return contador.getValor();
    }

    public static void main(String[] args) throws InterruptedException {
        System.out.println("Método synchronized: " + ejecutarPrueba(false));
        System.out.println("Bloque synchronized: " + ejecutarPrueba(true));
    }
}`
    }
  ],
  11: [
    {
      filename: 'InventarioEntradas.java',
      code: `public class InventarioEntradas {
    private final int total;
    private int siguiente = 1;

    public InventarioEntradas(int total) {
        this.total = total;
    }

    public synchronized int vender() {
        if (siguiente > total) {
            return -1;
        }
        return siguiente++;
    }
}`
    },
    {
      filename: 'Vendedor.java',
      code: `import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class Vendedor implements Runnable {
    private final InventarioEntradas inventario;
    private final List<Integer> vendidas = new ArrayList<>();

    public Vendedor(InventarioEntradas inventario) {
        this.inventario = inventario;
    }

    @Override
    public void run() {
        int entrada;
        while ((entrada = inventario.vender()) != -1) {
            vendidas.add(entrada);
        }
    }

    public List<Integer> getVendidas() {
        return Collections.unmodifiableList(vendidas);
    }
}`
    },
    {
      filename: 'Main.java',
      code: `import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class Main {
    private static void probar(int cantidad) throws InterruptedException {
        InventarioEntradas inventario = new InventarioEntradas(cantidad);
        Vendedor[] vendedores = {
            new Vendedor(inventario),
            new Vendedor(inventario),
            new Vendedor(inventario)
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
            System.out.println("Vendedor " + (indice + 1) + ": " + vendedores[indice].getVendidas());
            todas.addAll(vendedores[indice].getVendidas());
        }
        Collections.sort(todas);
        System.out.println("Entradas vendidas: " + todas);
        boolean correcto = todas.size() == cantidad;
        for (int indice = 0; indice < todas.size(); indice++) {
            if (todas.get(indice) != indice + 1) correcto = false;
        }
        System.out.println("Cantidad inicial: " + cantidad + ", total: " + todas.size());
        System.out.println("Prueba correcta: " + correcto);
    }

    public static void main(String[] args) throws InterruptedException {
        probar(20);
        probar(0);
        probar(1);
    }
}`
    }
  ]
};
