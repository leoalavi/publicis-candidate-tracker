-- Fictional sample data for local testing. These are NOT real people.
-- Emails use example.com and phone numbers use the 0491 570 xxx range,
-- which is reserved in Australia for fictional use.
-- Safe to re-run: it clears both tables first.

delete from candidate_notes;
delete from candidates;

insert into candidates (name, email, phone, role, resume_text, stage, source, created_at, updated_at) values
('Ava Thompson', 'ava.thompson@example.com', '0491 570 006', 'Frontend Engineer',
 'Frontend developer with 2 years of experience building React and TypeScript applications. Built an accessible design system used across three internal products. Comfortable with Tailwind CSS, Jest and Playwright. Bachelor of Computer Science.',
 'Interview', 'LinkedIn', now() - interval '12 days', now() - interval '2 days'),

('Liam Chen', 'liam.chen@example.com', null, 'Backend Engineer',
 'Graduate software engineer. Built REST APIs in Node.js and Express with PostgreSQL during a 6-month internship. Final-year project: a queue-based image processing service. Interested in cloud and distributed systems.',
 'Applied', 'Careers site', now() - interval '3 days', now() - interval '3 days'),

('Sofia Rossi', 'sofia.rossi@example.com', '0491 570 156', 'Full Stack Engineer',
 'Full stack engineer, 18 months at a fintech startup. Next.js, Python (FastAPI), PostgreSQL and AWS Lambda. Led migration of a legacy reporting page to server-side rendering, reducing load time by 40%.',
 'Offer', 'Referral', now() - interval '25 days', now() - interval '1 day'),

('Noah Williams', 'noah.williams@example.com', '0491 570 157', 'Frontend Engineer',
 'Junior web developer. Completed a coding bootcamp in 2025. Projects include a recipe app (React, Firebase) and a personal portfolio. Learning TypeScript.',
 'Rejected', 'Job board', now() - interval '20 days', now() - interval '15 days'),

('Mia Patel', 'mia.patel@example.com', '0491 570 158', 'Data Engineer',
 'Data engineer with 1.5 years of experience. Built ETL pipelines with Python, dbt and Airflow. SQL performance tuning on Snowflake. Some experience with Spark.',
 'Screening', 'LinkedIn', now() - interval '7 days', now() - interval '5 days'),

('Ethan Nguyen', 'ethan.nguyen@example.com', null, 'Backend Engineer',
 'Software engineer, 2 years in Java and Spring Boot building microservices for an e-commerce platform. Experience with Kafka, Docker and CI/CD pipelines on GitHub Actions.',
 'Screening', 'Referral', now() - interval '9 days', now() - interval '4 days');

-- A few notes, looked up by email so we don't hard-code generated IDs.
insert into candidate_notes (candidate_id, note_text, created_at)
select id, 'Strong portfolio. Moving to technical interview.', now() - interval '5 days'
from candidates where email = 'ava.thompson@example.com';

insert into candidate_notes (candidate_id, note_text, created_at)
select id, 'Technical interview booked for next Tuesday.', now() - interval '2 days'
from candidates where email = 'ava.thompson@example.com';

insert into candidate_notes (candidate_id, note_text, created_at)
select id, 'Offer sent. Awaiting response.', now() - interval '1 day'
from candidates where email = 'sofia.rossi@example.com';

insert into candidate_notes (candidate_id, note_text, created_at)
select id, 'Not enough TypeScript experience for this role yet. Encourage to reapply.', now() - interval '15 days'
from candidates where email = 'noah.williams@example.com';
