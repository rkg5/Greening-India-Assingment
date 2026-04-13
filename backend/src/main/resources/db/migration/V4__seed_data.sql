-- Seed demo data: 2 users, 2 projects, 9 tasks
-- Passwords: password123 (bcrypt cost 12)

-- Test User
INSERT INTO users (id, name, email, password) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Test User',
    'test@example.com',
    '$2b$12$axAGJm6o3YueQhcAHmdbQ.7fXHF0UyKJqXXQJpfbMlvrPxgEl/IGS'
);

-- Demo User
INSERT INTO users (id, name, email, password) VALUES (
    'a0000000-0000-0000-0000-000000000002',
    'Demo User',
    'demo@example.com',
    '$2b$12$axAGJm6o3YueQhcAHmdbQ.7fXHF0UyKJqXXQJpfbMlvrPxgEl/IGS'
);

-- Project 1: TaskFlow Demo (owned by Test User)
INSERT INTO projects (id, name, description, owner_id) VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'TaskFlow Demo',
    'End-to-end demo project — mix of done, in-progress, and todo tasks.',
    'a0000000-0000-0000-0000-000000000001'
);

-- Project 2: Mobile App v2 (owned by Demo User)
INSERT INTO projects (id, name, description, owner_id) VALUES (
    'b0000000-0000-0000-0000-000000000002',
    'Mobile App v2',
    'Next version of the consumer mobile app — redesign + stability sprint.',
    'a0000000-0000-0000-0000-000000000002'
);

-- Tasks for Project 1 (cross-assigned between users)
INSERT INTO tasks (id, title, status, priority, project_id, creator_id, assignee_id) VALUES
('c0000000-0000-0000-0000-000000000101', 'Design the dashboard layout',       'done',        'high',   'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001'),
('c0000000-0000-0000-0000-000000000102', 'Implement user authentication',      'done',        'high',   'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002'),
('c0000000-0000-0000-0000-000000000103', 'Write API documentation',            'in_progress', 'medium', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001'),
('c0000000-0000-0000-0000-000000000104', 'Set up CI/CD pipeline',              'todo',        'medium', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002'),
('c0000000-0000-0000-0000-000000000105', 'Performance audit and benchmarking', 'todo',        'low',    'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001');

-- Tasks for Project 2 (cross-assigned between users)
INSERT INTO tasks (id, title, status, priority, project_id, creator_id, assignee_id) VALUES
('c0000000-0000-0000-0000-000000000201', 'Redesign the onboarding flow',         'in_progress', 'high',   'b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002'),
('c0000000-0000-0000-0000-000000000202', 'Fix login crash on iOS 17',            'todo',        'high',   'b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001'),
('c0000000-0000-0000-0000-000000000203', 'Update push notification service',     'done',        'medium', 'b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002'),
('c0000000-0000-0000-0000-000000000204', 'Add dark mode to all screens',         'todo',        'low',    'b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001');
