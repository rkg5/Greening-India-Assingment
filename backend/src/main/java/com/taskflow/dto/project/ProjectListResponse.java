package com.taskflow.dto.project;

import com.taskflow.dto.common.PaginationMeta;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data @AllArgsConstructor
public class ProjectListResponse {
    private List<ProjectResponse> projects;
    private PaginationMeta pagination;
}
