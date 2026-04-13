package com.taskflow.controller;

import com.taskflow.dto.task.TaskResponse;
import com.taskflow.dto.task.UpdateTaskRequest;
import com.taskflow.entity.Task;
import com.taskflow.entity.User;
import com.taskflow.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @PatchMapping("/{taskId}")
    public TaskResponse updateTask(
            @PathVariable UUID taskId,
            @Valid @RequestBody UpdateTaskRequest request,
            @AuthenticationPrincipal User currentUser) {
        Task task = taskService.updateTask(taskId, request, currentUser);
        return TaskResponse.from(task);
    }

    @DeleteMapping("/{taskId}")
    public ResponseEntity<Void> deleteTask(
            @PathVariable UUID taskId,
            @AuthenticationPrincipal User currentUser) {
        taskService.deleteTask(taskId, currentUser);
        return ResponseEntity.noContent().build();
    }
}
