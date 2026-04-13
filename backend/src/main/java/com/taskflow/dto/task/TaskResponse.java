package com.taskflow.dto.task;

import com.taskflow.entity.Task;
import com.taskflow.entity.TaskPriority;
import com.taskflow.entity.TaskStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data @Builder @AllArgsConstructor
public class TaskResponse {
    private UUID id;
    private String title;
    private String description;
    private TaskStatus status;
    private TaskPriority priority;
    private UUID projectId;
    private UUID assigneeId;
    private String assigneeName;
    private String assigneeEmail;
    private LocalDate dueDate;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public static TaskResponse from(Task task) {
        TaskResponseBuilder builder = TaskResponse.builder()
                .id(task.getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .status(task.getStatus())
                .priority(task.getPriority())
                .projectId(task.getProjectId())
                .assigneeId(task.getAssigneeId())
                .dueDate(task.getDueDate())
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt());

        if (task.getAssignee() != null) {
            builder.assigneeName(task.getAssignee().getName());
            builder.assigneeEmail(task.getAssignee().getEmail());
        }

        return builder.build();
    }
}
