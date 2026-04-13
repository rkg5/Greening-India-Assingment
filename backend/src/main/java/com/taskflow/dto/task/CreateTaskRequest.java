package com.taskflow.dto.task;

import com.taskflow.entity.TaskPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class CreateTaskRequest {
    @NotBlank(message = "is required")
    @Size(max = 500, message = "must be at most 500 characters")
    private String title;

    private String description;
    private TaskPriority priority = TaskPriority.MEDIUM;
    private UUID assigneeId;
    private LocalDate dueDate;
}
