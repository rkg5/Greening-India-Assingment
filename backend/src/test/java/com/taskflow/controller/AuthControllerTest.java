package com.taskflow.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.taskflow.dto.auth.LoginRequest;
import com.taskflow.dto.auth.RegisterRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for authentication endpoints.
 * Uses H2 in-memory database via the 'test' profile.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void register_success_returnsTokenAndUser() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setName("Integration User");
        request.setEmail("integration@test.com");
        request.setPassword("password123");

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.user.name", is("Integration User")))
                .andExpect(jsonPath("$.user.email", is("integration@test.com")))
                .andExpect(jsonPath("$.user.id", notNullValue()));
    }

    @Test
    void register_duplicateEmail_returns400() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setName("First User");
        request.setEmail("duplicate@test.com");
        request.setPassword("password123");

        // First registration — should succeed
        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        // Second registration with same email — should fail
        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("validation failed")))
                .andExpect(jsonPath("$.fields.email", is("already exists")));
    }

    @Test
    void login_wrongPassword_returns401() throws Exception {
        // Register first
        RegisterRequest registerReq = new RegisterRequest();
        registerReq.setName("Login Test");
        registerReq.setEmail("logintest@test.com");
        registerReq.setPassword("correctpassword");

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated());

        // Login with wrong password
        LoginRequest loginReq = new LoginRequest();
        loginReq.setEmail("logintest@test.com");
        loginReq.setPassword("wrongpassword");

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error", is("unauthorized")));
    }

    @Test
    void login_success_returnsTokenAndUser() throws Exception {
        // Register first
        RegisterRequest registerReq = new RegisterRequest();
        registerReq.setName("Login Success");
        registerReq.setEmail("loginsuccess@test.com");
        registerReq.setPassword("password123");

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated());

        // Login with correct password
        LoginRequest loginReq = new LoginRequest();
        loginReq.setEmail("loginsuccess@test.com");
        loginReq.setPassword("password123");

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.user.email", is("loginsuccess@test.com")));
    }

    @Test
    void protectedEndpoint_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/projects")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error", is("unauthorized")));
    }

    @Test
    void register_missingFields_returns400() throws Exception {
        // Empty body
        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("validation failed")))
                .andExpect(jsonPath("$.fields", notNullValue()));
    }
}
