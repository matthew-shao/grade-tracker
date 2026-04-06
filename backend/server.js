require('dotenv').config();

const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Grade Tracker API is running');
});

// Get all courses
app.get('/courses', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM courses ORDER BY id ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error getting courses:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a course
app.post('/courses', async (req, res) => {
  try {
    const { name, semester } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Course name is required' });
    }

    const result = await pool.query(
      'INSERT INTO courses (name, semester) VALUES ($1, $2) RETURNING *',
      [name, semester || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating course:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get assignments for one specific course
app.get('/courses/:id/assignments', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT *
       FROM assignments
       WHERE course_id = $1
       ORDER BY id ASC`,
      [id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error getting assignments for course:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create an assignment
app.post('/assignments', async (req, res) => {
  try {
    const { course_id, name, category, score, total, weight, due_date } = req.body;

    if (!course_id || !name) {
      return res.status(400).json({ error: 'course_id and name are required' });
    }

    const result = await pool.query(
      `INSERT INTO assignments
      (course_id, name, category, score, total, weight, due_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        Number(course_id),
        name,
        category || null,
        score === '' || score == null ? null : Number(score),
        total === '' || total == null ? null : Number(total),
        weight === '' || weight == null ? null : Number(weight),
        due_date || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating assignment:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Weighted averages by course
// weight is entered like 30 for 30%
app.get('/averages', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        courses.id,
        courses.name AS course_name,
        ROUND(
          SUM(
            CASE
              WHEN assignments.score IS NOT NULL
               AND assignments.total IS NOT NULL
               AND assignments.total != 0
               AND assignments.weight IS NOT NULL
              THEN (assignments.score / assignments.total) * assignments.weight
              ELSE 0
            END
          )::numeric,
          2
        ) AS average_percent
      FROM courses
      LEFT JOIN assignments ON assignments.course_id = courses.id
      GROUP BY courses.id, courses.name
      ORDER BY courses.id ASC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('Error getting averages:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});