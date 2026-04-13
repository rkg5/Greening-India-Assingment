package com.taskflow.dto.common;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data @AllArgsConstructor
public class PaginationMeta {
    private int page;
    private int limit;
    private long total;
    private int pages;
}
