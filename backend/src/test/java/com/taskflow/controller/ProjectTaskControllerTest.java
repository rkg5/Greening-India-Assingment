package com.taskflow.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taskflow.dto.auth.RegisterRequest;
import com.taskflow.dto.project.CreateProjectRequest;
import com.taskflow.dto.task.CreateTaskRequest;
import com.taskflow.entity.TaskPriority;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for project and task CRUD endpoints.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ProjectTaskControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String token;
    private String userId;

    @BeforeEach
    void setUp() throws Exception {
        // Register a unique user for each test
        String email = "projtest_" + System.nanoTime() + "@test.com";
        RegisterRequest registerReq = new RegisterRequest();
        registerReq.setName("Project Tester");
        registerReq.setEmail(email);
        registerReq.setPassword("password123");

        MvcResult result = mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        token = body.get("token").asText();
        userId = body.get("user").get("id").asText();
    }

    @Test
    void createAndListProjects() throws Exception {
        // Create a project
        CreateProjectRequest req = new CreateProjectRequest();
        req.setName("Test Project");
        req.setDescription("Integration test project");

        mockMvc.perform(post("/projects")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name", is("Test Project")))
                .andExpect(jsonPath("$.owner_id", is(userId)));

        // List projects — should include the one we just created
        mockMvc.perform(get("/projects")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.projects", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.pagination.total", greaterThanOrEqualTo(1)));
    }

    @Test
    void createTask_andUpdateStatus() throws Exception {
        // Create a project first
        CreateProjectRequest projReq = new CreateProjectRequest();
        projReq.setName("Task Test Project");
        projReq.setDescription("For task testing");

        MvcResult projResult = mockMvc.perform(post("/projects")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(projReq)))
                .andExpect(status().isCreated())
                .andReturn();

        String projectId = objectMapper.readTree(
                projResult.getResponse().getContentAsString()).get("id").asText();

        // Create a task
        CreateTaskRequest taskReq = new CreateTaskRequest();
        taskReq.setTitle("Test Task");
        taskReq.setDescription("Integration test task");
        taskReq.setPriority(TaskPriority.HIGH);

        MvcResult taskResult = mockMvc.perform(post("/projects/" + projectId + "/tasks")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(taskReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title", is("Test Task")))
                .andExpect(jsonPath("$.status", is("todo")))
                .andExpect(jsonPath("$.priority", is("high")))
                .andReturn();

        String taskId = objectMapper.readTree(
                taskResult.getResponse().getContentAsString()).get("id").asText();

        // Update task status to done
        mockMvc.perform(patch("/tasks/" + taskId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\": \"done\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("done")));
    }

    @Test
    void deleteProject_asOwner_returns204() throws Exception {
        // Create project
        CreateProjectRequest req = new CreateProjectRequest();
        req.setName("Delete Me");

        MvcResult result = mockMvc.perform(post("/projects")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();

        String projectId = objectMapper.readTree(
                result.getResponse().getContentAsString()).get("id").asText();

        // Delete it
        mockMvc.perform(delete("/projects/" + projectId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());
    }

    @Test
    void deleteProject_nonOwner_returns403() throws Exception {
        // Create project with first user
        CreateProjectRequest req = new CreateProjectRequest();
        req.setName("Not Yours");

        MvcResult result = mockMvc.perform(post("/projects")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();

        String projectId = objectMapper.readTree(
                result.getResponse().getContentAsString()).get("id").asText();

        // Register a second user
        String email2 = "other_" + System.nanoTime() + "@test.com";
        RegisterRequest reg2 = new RegisterRequest();
        reg2.setName("Other User");
        reg2.setEmail(email2);
        reg2.setPassword("password123");

        MvcResult reg2Result = mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reg2)))
                .andExpect(status().isCreated())
                .andReturn();

        String token2 = objectMapper.readTree(
                reg2Result.getResponse().getContentAsString()).get("token").asText();

        // Try to delete with second user — should be forbidden (returns 404 to not leak existence)
        mockMvc.perform(delete("/projects/" + projectId)
                        .header("Authorization", "Bearer " + token2))
                .andExpect(status().is(anyOf(is(403), is(404))));
    }
}
