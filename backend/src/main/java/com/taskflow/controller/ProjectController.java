package com.taskflow.controller;

import com.taskflow.dto.common.PaginationMeta;
import com.taskflow.dto.project.*;
import com.taskflow.dto.task.*;
import com.taskflow.entity.Project;
import com.taskflow.entity.Task;
import com.taskflow.entity.TaskStatus;
import com.taskflow.entity.User;
import com.taskflow.service.ProjectService;
import com.taskflow.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;
    private final TaskService taskService;

    @GetMapping
    public ProjectListResponse listProjects(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int limit,
            @AuthenticationPrincipal User currentUser) {

        limit = Math.min(limit, 100);
        Page<Project> projectPage = projectService.listProjects(currentUser, page, limit);

        List<ProjectResponse> projects = projectPage.getContent().stream()
                .map(ProjectResponse::from)
                .toList();

        PaginationMeta pagination = new PaginationMeta(
                page, limit, projectPage.getTotalElements(),
                projectPage.getTotalPages() == 0 ? 1 : projectPage.getTotalPages());

        return new ProjectListResponse(projects, pagination);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProjectResponse createProject(
            @Valid @RequestBody CreateProjectRequest request,
            @AuthenticationPrincipal User currentUser) {
        Project project = projectService.createProject(request.getName(), request.getDescription(), currentUser);
        return ProjectResponse.from(project);
    }

    @GetMapping("/{projectId}")
    public ProjectWithTasksResponse getProject(
            @PathVariable UUID projectId,
            @AuthenticationPrincipal User currentUser) {
        Project project = projectService.getProject(projectId, currentUser, true);
        return ProjectWithTasksResponse.from(project);
    }

    @PatchMapping("/{projectId}")
    public ProjectResponse updateProject(
            @PathVariable UUID projectId,
            @Valid @RequestBody UpdateProjectRequest request,
            @AuthenticationPrincipal User currentUser) {
        Project project = projectService.updateProject(projectId, request, currentUser);
        return ProjectResponse.from(project);
    }

    @DeleteMapping("/{projectId}")
    public ResponseEntity<Void> deleteProject(
            @PathVariable UUID projectId,
            @AuthenticationPrincipal User currentUser) {
        projectService.deleteProject(projectId, currentUser);
        return ResponseEntity.noContent().build();
    }

    // --- Tasks under project ---

    @GetMapping("/{projectId}/tasks")
    public TaskListResponse listTasks(
            @PathVariable UUID projectId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) UUID assignee,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @AuthenticationPrincipal User currentUser) {

        TaskStatus taskStatus = null;
        if (status != null && !status.isEmpty()) {
            taskStatus = TaskStatus.fromValue(status);
        }

        List<Task> allTasks = taskService.listTasks(projectId, currentUser, taskStatus, assignee);

        // Manual pagination
        int total = allTasks.size();
        limit = Math.min(limit, 100);
        int start = (page - 1) * limit;
        int end = Math.min(start + limit, total);
        List<Task> pagedTasks = start < total ? allTasks.subList(start, end) : List.of();

        int pages = total > 0 ? (int) Math.ceil((double) total / limit) : 1;

        List<TaskResponse> taskResponses = pagedTasks.stream()
                .map(TaskResponse::from)
                .toList();

        return new TaskListResponse(taskResponses,
                new PaginationMeta(page, limit, total, pages));
    }

    @PostMapping("/{projectId}/tasks")
    @ResponseStatus(HttpStatus.CREATED)
    public TaskResponse createTask(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateTaskRequest request,
            @AuthenticationPrincipal User currentUser) {
        Task task = taskService.createTask(projectId, request, currentUser);
        return TaskResponse.from(task);
    }

    @GetMapping("/{projectId}/stats")
    public Map<String, Object> getStats(
            @PathVariable UUID projectId,
            @AuthenticationPrincipal User currentUser) {
        return taskService.getStats(projectId, currentUser);
    }
}
