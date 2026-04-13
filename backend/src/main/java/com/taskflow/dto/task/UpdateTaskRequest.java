package com.taskflow.dto.task;

import com.taskflow.entity.TaskPriority;
import com.taskflow.entity.TaskStatus;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class UpdateTaskRequest {
    @Size(min = 1, max = 500, message = "must be between 1 and 500 characters")
    private String title;

    private String description;
    private TaskStatus status;
    private TaskPriority priority;
    private UUID assigneeId;
    private LocalDate dueDate;
}
