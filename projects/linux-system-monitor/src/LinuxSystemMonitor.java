import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

public class LinuxSystemMonitor {

    public static void main(String[] args) {
        System.out.println("=== Linux System Monitor ===");
        System.out.println();

        showFileValue("Hostname", "/etc/hostname");
        showFileValue("Uptime", "/proc/uptime");
        showCpuInfo();
        showMemoryInfo();
        showDiskUsage();
    }

    private static void showFileValue(String label, String file) {
        try {
            String value = Files.readString(Path.of(file)).trim();
            System.out.println(label + ": " + value);
        } catch (IOException e) {
            System.out.println(label + ": unavailable");
        }
    }

    private static void showCpuInfo() {
        System.out.println("\n--- CPU ---");

        try {
            List<String> lines = Files.readAllLines(Path.of("/proc/cpuinfo"));

            for (String line : lines) {
                if (line.startsWith("model name")) {
                    System.out.println(line);
                    break;
                }
            }

            long processors = lines.stream()
                    .filter(line -> line.startsWith("processor"))
                    .count();

            System.out.println("Logical CPUs: " + processors);
        } catch (IOException e) {
            System.out.println("CPU information unavailable.");
        }
    }

    private static void showMemoryInfo() {
        System.out.println("\n--- Memory ---");

        try {
            List<String> lines = Files.readAllLines(Path.of("/proc/meminfo"));

            lines.stream()
                    .filter(line -> line.startsWith("MemTotal:")
                            || line.startsWith("MemAvailable:"))
                    .forEach(System.out::println);

        } catch (IOException e) {
            System.out.println("Memory information unavailable.");
        }
    }

    private static void showDiskUsage() {
        System.out.println("\n--- Disk ---");

        try {
            Process process = new ProcessBuilder("df", "-h", "/")
                    .redirectErrorStream(true)
                    .start();

            process.getInputStream()
                    .transferTo(System.out);

            process.waitFor();
        } catch (IOException | InterruptedException e) {
            System.out.println("Disk information unavailable.");
        }
    }
}
