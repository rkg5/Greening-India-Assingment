package com.taskflow.dto.project;

import com.taskflow.dto.task.TaskResponse;
import com.taskflow.entity.Project;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Data @Builder @AllArgsConstructor
public class ProjectWithTasksResponse {
    private UUID id;
    private String name;
    private String description;
    private UUID ownerId;
    private OffsetDateTime createdAt;
    private int taskCount;
    private int userCount;
    private List<TaskResponse> tasks;

    public static ProjectWithTasksResponse from(Project project) {
        List<TaskResponse> taskResponses = project.getTasks() != null
                ? project.getTasks().stream().map(TaskResponse::from).toList()
                : Collections.emptyList();

        return ProjectWithTasksResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .ownerId(project.getOwnerId())
                .createdAt(project.getCreatedAt())
                .taskCount(project.getTaskCount())
                .userCount(project.getUserCount())
                .tasks(taskResponses)
                .build();
    }
}
