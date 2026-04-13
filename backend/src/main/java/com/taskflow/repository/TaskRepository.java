package com.taskflow.repository;

import com.taskflow.entity.Task;
import com.taskflow.entity.TaskStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TaskRepository extends JpaRepository<Task, UUID> {

    @Query("SELECT t FROM Task t LEFT JOIN FETCH t.assignee WHERE t.id = :id")
    Optional<Task> findByIdWithAssignee(@Param("id") UUID id);

    @Query("""
        SELECT t FROM Task t LEFT JOIN FETCH t.assignee
        WHERE t.projectId = :projectId
        AND (:status IS NULL OR t.status = :status)
        AND (:assigneeId IS NULL OR t.assigneeId = :assigneeId)
        ORDER BY t.createdAt DESC
        """)
    List<Task> findByProjectIdWithFilters(
            @Param("projectId") UUID projectId,
            @Param("status") TaskStatus status,
            @Param("assigneeId") UUID assigneeId);

    @Query("""
        SELECT t FROM Task t LEFT JOIN FETCH t.assignee
        WHERE t.projectId = :projectId
        ORDER BY t.createdAt DESC
        """)
    List<Task> findByProjectIdWithAssignee(@Param("projectId") UUID projectId);

    long countByProjectId(UUID projectId);

    @Query("SELECT t.status, COUNT(t) FROM Task t WHERE t.projectId = :projectId GROUP BY t.status")
    List<Object[]> countByStatusForProject(@Param("projectId") UUID projectId);

    @Query("""
        SELECT t.assigneeId, u.name, COUNT(t)
        FROM Task t LEFT JOIN User u ON t.assigneeId = u.id
        WHERE t.projectId = :projectId
        GROUP BY t.assigneeId, u.name
        """)
    List<Object[]> countByAssigneeForProject(@Param("projectId") UUID projectId);
}
