import java.io.Serializable;
import java.util.HashMap;
import java.util.Map;

public class Student implements Serializable {
    private int rollNumber;
    private String name;
    private String course;
    private Map<String, Integer> subjectMarks;

    public Student(int rollNumber, String name, String course, Map<String, Integer> subjectMarks) {
        this.rollNumber = rollNumber;
        this.name = name;
        this.course = course;
        this.subjectMarks = subjectMarks;
    }

    public int getRollNumber() {
        return rollNumber;
    }

    public void setRollNumber(int rollNumber) {
        this.rollNumber = rollNumber;
    }

    public String getName() {
        return name;
    }

    public String getCourse() {
        return course;
    }

    public Map<String, Integer> getSubjectMarks() {
        return subjectMarks;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setCourse(String course) {
        this.course = course;
    }

    public void setSubjectMarks(Map<String, Integer> subjectMarks) {
        this.subjectMarks = subjectMarks;
    }

    public double getPercentage() {
        if (subjectMarks == null || subjectMarks.isEmpty())
            return 0.0;
        int total = subjectMarks.values().stream().mapToInt(Integer::intValue).sum();
        return total / (double) subjectMarks.size();
    }

    public String getGrade() {
        double p = getPercentage();
        if (p >= 90)
            return "A+";
        else if (p >= 80)
            return "A";
        else if (p >= 70)
            return "B";
        else if (p >= 60)
            return "C";
        else if (p >= 50)
            return "D";
        else
            return "F";
    }

    public String toFileString() {
        // Format: roll,name,course,Math:90|Phy:80...
        StringBuilder sb = new StringBuilder();
        sb.append(rollNumber).append(",")
                .append(name).append(",")
                .append(course).append(",");

        if (subjectMarks != null) {
            StringBuilder mb = new StringBuilder();
            for (Map.Entry<String, Integer> entry : subjectMarks.entrySet()) {
                if (mb.length() > 0)
                    mb.append("|");
                mb.append(entry.getKey()).append(":").append(entry.getValue());
            }
            sb.append(mb.toString());
        } else {
            sb.append("");
        }
        return sb.toString();
    }

    public static Student fromFileString(String line) {
        try {
            String[] parts = line.split(",");
            if (parts.length < 4)
                return null;

            int roll = Integer.parseInt(parts[0]);
            String name = parts[1];
            String course = parts[2];
            String marksStr = parts[3];

            Map<String, Integer> marks = new HashMap<>();
            if (!marksStr.isEmpty()) {
                String[] subjects = marksStr.split("\\|");
                for (String s : subjects) {
                    String[] kv = s.split(":");
                    if (kv.length == 2) {
                        marks.put(kv[0], Integer.parseInt(kv[1]));
                    }
                }
            }
            return new Student(roll, name, course, marks);
        } catch (Exception e) {
            return null;
        }
    }

    public String toJson() {
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"rollNumber\":").append(rollNumber).append(",");
        sb.append("\"name\":\"").append(escape(name)).append("\",");
        sb.append("\"course\":\"").append(escape(course)).append("\",");
        sb.append("\"percentage\":").append(String.format("%.2f", getPercentage())).append(",");
        sb.append("\"grade\":\"").append(getGrade()).append("\",");
        sb.append("\"marks\":{");

        if (subjectMarks != null) {
            int i = 0;
            for (Map.Entry<String, Integer> entry : subjectMarks.entrySet()) {
                if (i > 0)
                    sb.append(",");
                sb.append("\"").append(entry.getKey()).append("\":").append(entry.getValue());
                i++;
            }
        }
        sb.append("}");
        sb.append("}");
        return sb.toString();
    }

    public static Student fromJson(String json) {
        try {
            json = json.trim();
            if (json.startsWith("{"))
                json = json.substring(1);
            if (json.endsWith("}"))
                json = json.substring(0, json.length() - 1);

            // Simple manual parser update
            // Strategy: Extract simple fields first, then parse marks object manually
            // This is fragile but fits the "no deps" constraint given the existing code.
            // A regex approach for specific known fields is safer.

            int roll = extractInt(json, "rollNumber");
            String name = extractString(json, "name");
            String course = extractString(json, "course");
            Map<String, Integer> marks = extractMarks(json);

            return new Student(roll, name, course, marks);
        } catch (Exception e) {
            System.err.println("Error parsing JSON: " + e.getMessage());
            return null;
        }
    }

    private static int extractInt(String json, String key) {
        try {
            String match = "\"" + key + "\":";
            int start = json.indexOf(match);
            if (start == -1)
                return 0;
            start += match.length();
            int end = json.indexOf(",", start);
            if (end == -1)
                end = json.indexOf("}", start); // careful with nested objects
            // safer: read until non-digit
            int i = start;
            while (i < json.length() && (Character.isDigit(json.charAt(i)) || json.charAt(i) == '.'))
                i++;
            return Integer.parseInt(json.substring(start, i));
        } catch (Exception e) {
            return 0;
        }
    }

    private static String extractString(String json, String key) {
        try {
            String match = "\"" + key + "\":\"";
            int start = json.indexOf(match);
            if (start == -1)
                return "";
            start += match.length();
            int end = json.indexOf("\"", start);
            return json.substring(start, end);
        } catch (Exception e) {
            return "";
        }
    }

    private static Map<String, Integer> extractMarks(String json) {
        Map<String, Integer> map = new HashMap<>();
        try {
            String match = "\"marks\":{";
            int start = json.indexOf(match);
            if (start == -1)
                return map;
            start += match.length();
            int end = json.indexOf("}", start);
            String content = json.substring(start, end);

            String[] pairs = content.split(",");
            for (String pair : pairs) {
                String[] kv = pair.split(":");
                if (kv.length == 2) {
                    String k = kv[0].replace("\"", "").trim();
                    int v = Integer.parseInt(kv[1].trim());
                    map.put(k, v);
                }
            }
        } catch (Exception e) {
        }
        return map;
    }

    private String escape(String s) {
        return s.replace("\"", "\\\"");
    }
}
