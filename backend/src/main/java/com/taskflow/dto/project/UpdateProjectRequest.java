package com.taskflow.dto.project;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProjectRequest {
    @Size(max = 255, message = "must be at most 255 characters")
    private String name;

    private String description;
}
