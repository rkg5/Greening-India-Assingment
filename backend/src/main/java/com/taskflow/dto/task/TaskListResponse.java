package com.taskflow.dto.task;

import com.taskflow.dto.common.PaginationMeta;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data @AllArgsConstructor
public class TaskListResponse {
    private List<TaskResponse> tasks;
    private PaginationMeta pagination;
}
