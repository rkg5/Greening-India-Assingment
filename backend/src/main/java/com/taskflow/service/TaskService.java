package com.taskflow.service;

import com.taskflow.dto.task.CreateTaskRequest;
import com.taskflow.dto.task.UpdateTaskRequest;
import com.taskflow.entity.Task;
import com.taskflow.entity.TaskStatus;
import com.taskflow.entity.User;
import com.taskflow.exception.GlobalExceptionHandler.ForbiddenException;
import com.taskflow.exception.GlobalExceptionHandler.NotFoundException;
import com.taskflow.repository.ProjectRepository;
import com.taskflow.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final ProjectService projectService;

    public List<Task> listTasks(UUID projectId, User currentUser,
                                TaskStatus status, UUID assigneeId) {
        // Verify access to project
        projectService.getProject(projectId, currentUser, false);

        return taskRepository.findByProjectIdWithFilters(projectId, status, assigneeId);
    }

    @Transactional
    public Task createTask(UUID projectId, CreateTaskRequest request, User currentUser) {
        // Verify access to project
        projectService.getProject(projectId, currentUser, false);

        Task task = Task.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .priority(request.getPriority())
                .status(TaskStatus.TODO)
                .projectId(projectId)
                .assigneeId(request.getAssigneeId())
                .creatorId(currentUser.getId())
                .dueDate(request.getDueDate())
                .build();

        task = taskRepository.save(task);
        return taskRepository.findByIdWithAssignee(task.getId()).orElseThrow();
    }

    @Transactional
    public Task updateTask(UUID taskId, UpdateTaskRequest request, User currentUser) {
        Task task = taskRepository.findByIdWithAssignee(taskId)
                .orElseThrow(NotFoundException::new);

        // Verify access to the task's project
        projectService.getProject(task.getProjectId(), currentUser, false);

        if (request.getTitle() != null) task.setTitle(request.getTitle());
        if (request.getDescription() != null) task.setDescription(request.getDescription());
        if (request.getStatus() != null) task.setStatus(request.getStatus());
        if (request.getPriority() != null) task.setPriority(request.getPriority());
        if (request.getAssigneeId() != null) task.setAssigneeId(request.getAssigneeId());
        if (request.getDueDate() != null) task.setDueDate(request.getDueDate());

        task.setUpdatedAt(OffsetDateTime.now());
        task = taskRepository.save(task);
        return taskRepository.findByIdWithAssignee(task.getId()).orElseThrow();
    }

    @Transactional
    public void deleteTask(UUID taskId, User currentUser) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(NotFoundException::new);

        var project = projectRepository.findById(task.getProjectId()).orElse(null);

        boolean authorized = Objects.equals(task.getCreatorId(), currentUser.getId())
                || (project != null && Objects.equals(project.getOwnerId(), currentUser.getId()));

        if (!authorized) {
            throw new ForbiddenException();
        }

        taskRepository.delete(task);
    }

    public Map<String, Object> getStats(UUID projectId, User currentUser) {
        projectService.getProject(projectId, currentUser, false);

        // Task counts by status
        Map<String, Integer> taskCounts = new LinkedHashMap<>();
        taskCounts.put("todo", 0);
        taskCounts.put("in_progress", 0);
        taskCounts.put("done", 0);

        for (Object[] row : taskRepository.countByStatusForProject(projectId)) {
            TaskStatus status = (TaskStatus) row[0];
            Long count = (Long) row[1];
            taskCounts.put(status.getValue(), count.intValue());
        }

        // By assignee
        List<Map<String, Object>> byAssignee = new ArrayList<>();
        for (Object[] row : taskRepository.countByAssigneeForProject(projectId)) {
            UUID assigneeId = (UUID) row[0];
            String assigneeName = (String) row[1];
            Long count = (Long) row[2];

            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("assignee_id", assigneeId != null ? assigneeId.toString() : null);
            entry.put("assignee_name", assigneeName);
            entry.put("count", count.intValue());
            byAssignee.add(entry);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("task_counts", taskCounts);
        result.put("by_assignee", byAssignee);
        return result;
    }
}
