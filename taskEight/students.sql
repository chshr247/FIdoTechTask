CREATE TABLE student (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    birth_date DATE NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    enrollment_year SMALLINT NOT NULL CHECK (enrollment_year >= 1991)
);

CREATE TABLE discipline (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    credits NUMERIC(4,1) NOT NULL CHECK (credits > 0),
    hours INTEGER NOT NULL CHECK (hours > 0)
);

CREATE TABLE student_discipline (
    student_id INTEGER NOT NULL REFERENCES student(id) ON DELETE CASCADE,
    discipline_id INTEGER NOT NULL REFERENCES discipline(id) ON DELETE CASCADE,
    group_number INTEGER NOT NULL CHECK (group_number > 0),
    PRIMARY KEY (student_id, discipline_id)
);

CREATE INDEX idx_sd_discipline_group ON student_discipline (discipline_id, group_number);

SELECT s.full_name, s.email
FROM student s
JOIN student_discipline sd ON sd.student_id = s.id
JOIN discipline d ON d.id = sd.discipline_id
WHERE d.name = 'Програмування'
  AND sd.group_number = 5;