# Linux System Monitor

A small Java command-line project for learning Linux system interaction.

## What it does

The program displays:

- Linux kernel / OS information
- Hostname
- CPU information from /proc/cpuinfo
- Memory information from /proc/meminfo
- Disk usage using the Linux `df` command
- System uptime from /proc/uptime

## Run

Requires Java 17+.

```bash
javac src/LinuxSystemMonitor.java -d out
java -cp out LinuxSystemMonitor
```

## Learning goals

This intentionally starts simple so it can be expanded later. Possible next steps:

1. Add command-line arguments.
2. Parse CPU and memory values more cleanly.
3. Add process monitoring using `/proc`.
4. Add network statistics from `/proc/net`.
5. Export results as JSON.
6. Add a small Java GUI or web dashboard.
7. Add tests and a Maven/Gradle build.
