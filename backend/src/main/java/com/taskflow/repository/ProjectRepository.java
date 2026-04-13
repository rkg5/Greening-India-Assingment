package com.taskflow.repository;

import com.taskflow.entity.Project;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface ProjectRepository extends JpaRepository<Project, UUID> {

    /**
     * Projects the user owns OR has at least one task assigned in.
     */
    @Query("""
        SELECT DISTINCT p FROM Project p
        LEFT JOIN Task t ON t.projectId = p.id
        WHERE p.ownerId = :userId OR t.assigneeId = :userId
        ORDER BY p.createdAt DESC
        """)
    Page<Project> findAccessibleProjects(@Param("userId") UUID userId, Pageable pageable);

    @Query("SELECT COUNT(t) FROM Task t WHERE t.projectId = :projectId")
    int countTasksByProjectId(@Param("projectId") UUID projectId);

    /**
     * Count distinct users involved in a project (owner + assignees).
     * Uses native SQL because JPQL doesn't support UNION.
     */
    @Query(value = """
        SELECT COUNT(*) FROM (
            SELECT owner_id AS uid FROM projects WHERE id = :projectId
            UNION
            SELECT assignee_id AS uid FROM tasks WHERE project_id = :projectId AND assignee_id IS NOT NULL
        ) sub
        """, nativeQuery = true)
    int countUsersByProjectId(@Param("projectId") UUID projectId);

    @Query("SELECT CASE WHEN COUNT(t) > 0 THEN true ELSE false END FROM Task t WHERE t.projectId = :projectId AND t.assigneeId = :userId")
    boolean userHasAssignedTask(@Param("projectId") UUID projectId, @Param("userId") UUID userId);
}
