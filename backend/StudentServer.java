import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;

import java.io.*;
import java.net.InetSocketAddress;
import java.util.*;
import java.util.stream.Collectors;
import java.nio.charset.StandardCharsets;

public class StudentServer {
    private static final int PORT = 8080;
    private static final String FILE_NAME = "students.txt";
    private static List<Student> students = new ArrayList<>();
    private static final String CORS_ORIGIN = "*"; // For development

    // Admin Profile Storage (Simple In-Memory for now)
    private static AdminProfile adminProfile = new AdminProfile("Admin User", "admin@edumanager.com", "Super Admin");

    public static void main(String[] args) throws IOException {
        loadFromFile();

        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);

        // Define endpoints
        server.createContext("/api/students", new StudentsHandler());
        server.createContext("/api/students/", new StudentSpecificHandler());
        server.createContext("/api/admin", new AdminHandler());

        server.setExecutor(null); // default executor
        System.out.println("Server started on port " + PORT);
        server.start();
    }

    // Handlers
    static class AdminHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            handleCors(exchange);
            String method = exchange.getRequestMethod();

            if ("GET".equals(method)) {
                String json = adminProfile.toJson();
                sendResponse(exchange, 200, json);
            } else if ("POST".equals(method) || "PUT".equals(method)) {
                String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
                AdminProfile updates = AdminProfile.fromJson(body);
                if (updates != null) {
                    adminProfile = updates;
                    sendResponse(exchange, 200, adminProfile.toJson());
                } else {
                    sendResponse(exchange, 400, "Invalid JSON");
                }
            } else if ("OPTIONS".equals(method)) {
                exchange.sendResponseHeaders(204, -1);
            } else {
                sendResponse(exchange, 405, "Method Not Allowed");
            }
        }
    }

    static class StudentsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            handleCors(exchange);
            String method = exchange.getRequestMethod();

            if ("GET".equals(method)) {
                handleGetList(exchange);
            } else if ("POST".equals(method)) {
                handleAdd(exchange);
            } else if ("OPTIONS".equals(method)) {
                exchange.sendResponseHeaders(204, -1);
            } else {
                sendResponse(exchange, 405, "Method Not Allowed");
            }
        }
    }

    static class StudentSpecificHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            handleCors(exchange);
            String method = exchange.getRequestMethod();
            String path = exchange.getRequestURI().getPath();
            // Expected /api/students/{rollNumber}
            String[] segments = path.split("/");
            if (segments.length < 4) {
                sendResponse(exchange, 400, "Invalid ID");
                return;
            }

            int roll;
            try {
                roll = Integer.parseInt(segments[3]);
            } catch (NumberFormatException e) {
                sendResponse(exchange, 400, "Invalid Roll Number");
                return;
            }

            if ("PUT".equals(method)) {
                handleUpdate(exchange, roll);
            } else if ("DELETE".equals(method)) {
                handleDelete(exchange, roll);
            } else if ("OPTIONS".equals(method)) {
                exchange.sendResponseHeaders(204, -1);
            } else {
                sendResponse(exchange, 405, "Method Not Allowed");
            }
        }
    }

    // Implementation logic

    private static void handleGetList(HttpExchange exchange) throws IOException {
        String json = "[" + students.stream().map(Student::toJson).collect(Collectors.joining(",")) + "]";
        sendResponse(exchange, 200, json);
    }

    private static void handleAdd(HttpExchange exchange) throws IOException {
        String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
        Student s = Student.fromJson(body);

        if (s == null) {
            sendResponse(exchange, 400, "Invalid JSON");
            return;
        }

        synchronized (students) {
            // Auto-increment Roll Number
            int maxRoll = students.stream()
                    .mapToInt(Student::getRollNumber)
                    .max()
                    .orElse(0); // Start from 0 if empty, so first is 1
            int newRoll = maxRoll + 1;
            s.setRollNumber(newRoll);

            students.add(s);
            saveToFile();
        }
        sendResponse(exchange, 201, s.toJson());
    }

    private static void handleUpdate(HttpExchange exchange, int roll) throws IOException {
        String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
        Student updates = Student.fromJson(body);

        if (updates == null) {
            sendResponse(exchange, 400, "Invalid JSON");
            return;
        }

        synchronized (students) {
            Optional<Student> opt = students.stream().filter(s -> s.getRollNumber() == roll).findFirst();
            if (opt.isPresent()) {
                Student s = opt.get();
                s.setName(updates.getName());
                s.setCourse(updates.getCourse());
                s.setSubjectMarks(updates.getSubjectMarks());
                saveToFile();
                sendResponse(exchange, 200, s.toJson());
            } else {
                sendResponse(exchange, 404, "Student not found");
            }
        }
    }

    private static void handleDelete(HttpExchange exchange, int roll) throws IOException {
        synchronized (students) {
            boolean removed = students.removeIf(s -> s.getRollNumber() == roll);
            if (removed) {
                saveToFile();
                sendResponse(exchange, 200, "{\"status\":\"deleted\"}");
            } else {
                sendResponse(exchange, 404, "Student not found");
            }
        }
    }

    // Helpers

    private static void handleCors(HttpExchange exchange) throws IOException {
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", CORS_ORIGIN);
        exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");
    }

    private static void sendResponse(HttpExchange exchange, int statusCode, String response) throws IOException {
        byte[] bytes = response.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().add("Content-Type", "application/json");
        exchange.sendResponseHeaders(statusCode, bytes.length);
        OutputStream os = exchange.getResponseBody();
        os.write(bytes);
        os.close();
    }

    private static void loadFromFile() {
        File file = new File(FILE_NAME);
        if (!file.exists())
            return;
        try (BufferedReader br = new BufferedReader(new FileReader(FILE_NAME))) {
            String line;
            while ((line = br.readLine()) != null) {
                Student s = Student.fromFileString(line);
                if (s != null)
                    students.add(s);
            }
            System.out.println("Loaded " + students.size() + " records.");
        } catch (IOException e) {
            System.err.println("Error loading file: " + e.getMessage());
        }
    }

    private static synchronized void saveToFile() {
        try (BufferedWriter bw = new BufferedWriter(new FileWriter(FILE_NAME))) {
            for (Student s : students) {
                bw.write(s.toFileString());
                bw.newLine();
            }
        } catch (IOException e) {
            System.err.println("Error saving file: " + e.getMessage());
        }
    }

    // Simple Admin Class
    static class AdminProfile {
        String name;
        String email;
        String role;

        public AdminProfile(String name, String email, String role) {
            this.name = name;
            this.email = email;
            this.role = role;
        }

        public String toJson() {
            return String.format("{\"name\":\"%s\",\"email\":\"%s\",\"role\":\"%s\"}", name, email, role);
        }

        public static AdminProfile fromJson(String json) {
            // Very basic parse
            try {
                String name = extract(json, "name");
                String email = extract(json, "email");
                String role = extract(json, "role");
                return new AdminProfile(name, email, role);
            } catch (Exception e) {
                return null;
            }
        }

        private static String extract(String json, String key) {
            String match = "\"" + key + "\":\"";
            int start = json.indexOf(match);
            if (start == -1)
                return "";
            start += match.length();
            int end = json.indexOf("\"", start);
            return json.substring(start, end);
        }
    }
}
