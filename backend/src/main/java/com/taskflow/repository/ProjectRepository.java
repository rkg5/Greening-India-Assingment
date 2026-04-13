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

    @Query("""
        SELECT COUNT(DISTINCT u) FROM (
            SELECT p.ownerId AS uid FROM Project p WHERE p.id = :projectId
            UNION
            SELECT t.assigneeId AS uid FROM Task t WHERE t.projectId = :projectId AND t.assigneeId IS NOT NULL
        ) u
        """)
    int countUsersByProjectId(@Param("projectId") UUID projectId);

    @Query("SELECT CASE WHEN COUNT(t) > 0 THEN true ELSE false END FROM Task t WHERE t.projectId = :projectId AND t.assigneeId = :userId")
    boolean userHasAssignedTask(@Param("projectId") UUID projectId, @Param("userId") UUID userId);
}
