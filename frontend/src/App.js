import React, { useEffect, useState } from 'react';
import './App.css';

const API_BASE = 'https://grade-tracker-yecp.onrender.com';

function App() {
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [averages, setAverages] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);

  const [courseForm, setCourseForm] = useState({
    name: '',
    semester: '',
  });

  
  const [assignmentForm, setAssignmentForm] = useState({
    name: '',
    category: '',
    score: '',
    total: '',
    weight: '',
    due_date: '',
  });

  const fetchCourses = async () => {
    try {
      const res = await fetch(`${API_BASE}/courses`);
      const data = await res.json();
      setCourses(data);
    } catch (err) {
      console.error('Error fetching courses:', err);
    }
  };

  const fetchAssignmentsByCourse = async (courseId) => {
    try {
      const res = await fetch(`${API_BASE}/courses/${courseId}/assignments`);
      const data = await res.json();
      setAssignments(data);
    } catch (err) {
      console.error('Error fetching assignments:', err);
    }
  };

  const fetchAverages = async () => {
    try {
      const res = await fetch(`${API_BASE}/averages`);
      const data = await res.json();
      setAverages(data);
    } catch (err) {
      console.error('Error fetching averages:', err);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      await fetchCourses();
      await fetchAverages();
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    if (courses.length > 0 && !selectedCourseId) {
      setSelectedCourseId(courses[0].id);
    }
  }, [courses, selectedCourseId]);

  useEffect(() => {
    if (selectedCourseId) {
      fetchAssignmentsByCourse(selectedCourseId);
    }
  }, [selectedCourseId]);

  const handleCourseChange = (e) => {
    setCourseForm({
      ...courseForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleAssignmentChange = (e) => {
    setAssignmentForm({
      ...assignmentForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleCourseSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${API_BASE}/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseForm),
      });

      if (!res.ok) {
        throw new Error('Failed to add course');
      }

      const newCourse = await res.json();

      setCourseForm({
        name: '',
        semester: '',
      });

      await fetchCourses();
      await fetchAverages();
      setSelectedCourseId(newCourse.id);
    } catch (err) {
      console.error('Error adding course:', err);
    }
  };

  const handleAssignmentSubmit = async (e) => {
    e.preventDefault();

    if (!selectedCourseId) {
      return;
    }

    try {
      const payload = {
        course_id: Number(selectedCourseId),
        name: assignmentForm.name,
        category: assignmentForm.category || null,
        score: assignmentForm.score === '' ? null : Number(assignmentForm.score),
        total: assignmentForm.total === '' ? null : Number(assignmentForm.total),
        weight: assignmentForm.weight === '' ? null : Number(assignmentForm.weight),
        due_date: assignmentForm.due_date || null,
      };

      const res = await fetch(`${API_BASE}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Failed to add assignment');
      }

      setAssignmentForm({
        name: '',
        category: '',
        score: '',
        total: '',
        weight: '',
        due_date: '',
      });

      await fetchAssignmentsByCourse(selectedCourseId);
      await fetchAverages();
    } catch (err) {
      console.error('Error adding assignment:', err);
    }
  };

  const selectedCourse = courses.find((course) => course.id === selectedCourseId);

  const selectedCourseAverage = averages.find((avg) => avg.id === selectedCourseId);

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1>Grade Tracker</h1>
          <p>Track your courses, assignments, weights, and averages.</p>
        </header>

        <section className="card">
          <h2>Add Course</h2>
          <form onSubmit={handleCourseSubmit} className="form-row">
            <input
              type="text"
              name="name"
              placeholder="Course name"
              value={courseForm.name}
              onChange={handleCourseChange}
              required
            />
            <input
              type="text"
              name="semester"
              placeholder="Semester"
              value={courseForm.semester}
              onChange={handleCourseChange}
            />
            <button type="submit">Add Course</button>
          </form>
        </section>

        <section className="card">
          <h2>Courses</h2>
          {courses.length === 0 ? (
            <p>No courses yet. Add one above to get started.</p>
          ) : (
            <div className="tabs">
              {courses.map((course) => (
                <button
                  key={course.id}
                  type="button"
                  className={selectedCourseId === course.id ? 'tab active-tab' : 'tab'}
                  onClick={() => setSelectedCourseId(course.id)}
                >
                  {course.name}
                </button>
              ))}
            </div>
          )}
        </section>

        {selectedCourse && (
          <>
            <section className="card">
              <h2>{selectedCourse.name}</h2>
              <p>Semester: {selectedCourse.semester || 'Not set'}</p>
              <p>
                Current Weighted Average:{' '}
                <strong>
                  {selectedCourseAverage?.average_percent != null
                    ? `${selectedCourseAverage.average_percent}%`
                    : 'No assignments yet'}
                </strong>
              </p>
            </section>

            <section className="card">
              <h2>Add Assignment</h2>
              <p className="note">Enter weight as a percentage, like 30 for 30%.</p>

              <form onSubmit={handleAssignmentSubmit} className="assignment-form">
                <input
                  type="text"
                  name="name"
                  placeholder="Assignment name"
                  value={assignmentForm.name}
                  onChange={handleAssignmentChange}
                  required
                />

                <input
                  type="text"
                  name="category"
                  placeholder="Category"
                  value={assignmentForm.category}
                  onChange={handleAssignmentChange}
                />

                <input
                  type="number"
                  name="score"
                  placeholder="Score"
                  value={assignmentForm.score}
                  onChange={handleAssignmentChange}
                  required
                />

                <input
                  type="number"
                  name="total"
                  placeholder="Total"
                  value={assignmentForm.total}
                  onChange={handleAssignmentChange}
                  required
                />

                <input
                  type="number"
                  name="weight"
                  placeholder="Weight %"
                  value={assignmentForm.weight}
                  onChange={handleAssignmentChange}
                />

                <input
                  type="date"
                  name="due_date"
                  value={assignmentForm.due_date}
                  onChange={handleAssignmentChange}
                />

                <button type="submit">Add Assignment</button>
              </form>
            </section>

            <section className="card">
              <h2>Assignments for {selectedCourse.name}</h2>

              {assignments.length === 0 ? (
                <p>No assignments yet.</p>
              ) : (
                <div className="assignment-list">
                  {assignments.map((assignment) => (
                    <div key={assignment.id} className="assignment-item">
                      <div className="assignment-main">
                        <h3>{assignment.name}</h3>
                        <p>{assignment.category || 'No category'}</p>
                      </div>

                      <div className="assignment-meta">
                        <span>
                          {assignment.score}/{assignment.total}
                        </span>
                        <span>
                          {assignment.weight != null ? `${assignment.weight}%` : 'No weight'}
                        </span>
                        <span>
                          {assignment.due_date || 'No due date'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default App;