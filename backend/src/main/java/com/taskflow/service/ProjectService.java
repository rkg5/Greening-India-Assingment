package com.taskflow.service;

import com.taskflow.dto.project.UpdateProjectRequest;
import com.taskflow.entity.Project;
import com.taskflow.entity.User;
import com.taskflow.exception.GlobalExceptionHandler.ForbiddenException;
import com.taskflow.exception.GlobalExceptionHandler.NotFoundException;
import com.taskflow.repository.ProjectRepository;
import com.taskflow.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;

    public Page<Project> listProjects(User currentUser, int page, int limit) {
        PageRequest pageRequest = PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Project> projects = projectRepository.findAccessibleProjects(currentUser.getId(), pageRequest);

        projects.forEach(this::attachCounts);

        return projects;
    }

    public Project getProject(UUID projectId, User currentUser, boolean withTasks) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(NotFoundException::new);

        // Access check: owner or has assigned task
        if (!project.getOwnerId().equals(currentUser.getId())) {
            boolean hasTask = projectRepository.userHasAssignedTask(projectId, currentUser.getId());
            if (!hasTask) {
                throw new NotFoundException(); // Don't leak existence
            }
        }

        if (withTasks) {
            // Eagerly fetch tasks with assignee info
            var tasks = taskRepository.findByProjectIdWithAssignee(projectId);
            project.setTasks(tasks);
        }

        attachCounts(project);
        return project;
    }

    @Transactional
    public Project createProject(String name, String description, User currentUser) {
        Project project = Project.builder()
                .name(name)
                .description(description)
                .ownerId(currentUser.getId())
                .build();

        project = projectRepository.save(project);
        project = projectRepository.findById(project.getId()).orElseThrow();
        attachCounts(project);
        return project;
    }

    @Transactional
    public Project updateProject(UUID projectId, UpdateProjectRequest request, User currentUser) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(NotFoundException::new);

        if (!project.getOwnerId().equals(currentUser.getId())) {
            throw new ForbiddenException();
        }

        if (request.getName() != null) {
            project.setName(request.getName());
        }
        if (request.getDescription() != null) {
            project.setDescription(request.getDescription());
        }

        project = projectRepository.save(project);
        attachCounts(project);
        return project;
    }

    @Transactional
    public void deleteProject(UUID projectId, User currentUser) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(NotFoundException::new);

        if (!project.getOwnerId().equals(currentUser.getId())) {
            throw new ForbiddenException();
        }

        projectRepository.delete(project);
    }

    private void attachCounts(Project project) {
        project.setTaskCount(projectRepository.countTasksByProjectId(project.getId()));
        try {
            project.setUserCount(projectRepository.countUsersByProjectId(project.getId()));
        } catch (Exception e) {
            // Fallback: just count 1 for owner
            project.setUserCount(1);
        }
    }
}
