package com.taskflow.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class HealthController {

    private final DataSource dataSource;

    @GetMapping("/health")
    public Map<String, String> health() {
        String dbStatus;
        try (Connection conn = dataSource.getConnection()) {
            conn.createStatement().execute("SELECT 1");
            dbStatus = "connected";
        } catch (Exception e) {
            dbStatus = "disconnected";
        }
        return Map.of("status", "ok", "db", dbStatus);
    }
}
