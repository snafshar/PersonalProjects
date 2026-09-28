import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

public class ProcessInfo {

    public static void showTopProcesses(int limit) {
        System.out.println("\n--- Processes ---");

        try {
            List<String> processes = new ArrayList<>();

            try (var entries = Files.list(Path.of("/proc"))) {
                entries.filter(Files::isDirectory)
                        .filter(path -> path.getFileName().toString().matches("\\d+"))
                        .forEach(path -> {
                            Path status = path.resolve("status");

                            try {
                                String name = Files.readAllLines(status).stream()
                                        .filter(line -> line.startsWith("Name:"))
                                        .findFirst()
                                        .orElse("Name: unknown");

                                processes.add(path.getFileName() + " - " + name);
                            } catch (IOException ignored) {
                                // A process may disappear while /proc is being read.
                            }
                        });
            }

            processes.stream()
                    .sorted()
                    .limit(limit)
                    .forEach(System.out::println);

            System.out.println("Displayed: " + Math.min(limit, processes.size()));

        } catch (IOException e) {
            System.out.println("Process information unavailable.");
        }
    }
}
