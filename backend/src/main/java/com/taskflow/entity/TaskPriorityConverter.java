package com.taskflow.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class TaskPriorityConverter implements AttributeConverter<TaskPriority, String> {
    @Override
    public String convertToDatabaseColumn(TaskPriority priority) {
        return priority == null ? null : priority.getValue();
    }

    @Override
    public TaskPriority convertToEntityAttribute(String value) {
        return value == null ? null : TaskPriority.fromValue(value);
    }
}
