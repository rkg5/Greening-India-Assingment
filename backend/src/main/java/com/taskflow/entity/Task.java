package com.taskflow.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tasks")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Task {

    @Id
    @UuidGenerator
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 20)
    @Convert(converter = TaskStatusConverter.class)
    private TaskStatus status;

    @Column(nullable = false, length = 20)
    @Convert(converter = TaskPriorityConverter.class)
    private TaskPriority priority;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", insertable = false, updatable = false)
    private Project project;

    @Column(name = "assignee_id")
    private UUID assigneeId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignee_id", insertable = false, updatable = false)
    private User assignee;

    @Column(name = "creator_id")
    private UUID creatorId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creator_id", insertable = false, updatable = false)
    private User creator;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "created_at", nullable = false, updatable = false,
            insertable = false, columnDefinition = "TIMESTAMP WITH TIME ZONE DEFAULT now()")
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false,
            insertable = false, columnDefinition = "TIMESTAMP WITH TIME ZONE DEFAULT now()")
    private OffsetDateTime updatedAt;
}
