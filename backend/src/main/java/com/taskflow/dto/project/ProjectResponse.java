package com.taskflow.dto.project;

import com.taskflow.entity.Project;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data @Builder @AllArgsConstructor
public class ProjectResponse {
    private UUID id;
    private String name;
    private String description;
    private UUID ownerId;
    private OffsetDateTime createdAt;
    private int taskCount;
    private int userCount;

    public static ProjectResponse from(Project project) {
        return ProjectResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .ownerId(project.getOwnerId())
                .createdAt(project.getCreatedAt())
                .taskCount(project.getTaskCount())
                .userCount(project.getUserCount())
                .build();
    }
}
