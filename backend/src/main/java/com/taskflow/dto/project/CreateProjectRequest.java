package com.taskflow.dto.project;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateProjectRequest {
    @NotBlank(message = "is required")
    @Size(max = 255, message = "must be at most 255 characters")
    private String name;

    private String description;
}
