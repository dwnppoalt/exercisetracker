const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// In-memory database
const users = [];
const exercises = {};

// Create a new user
app.post('/api/users', (req, res) => {
  const username = req.body.username;
  const userId = uuidv4();
  users.push({ username, _id: userId });
  res.json({ username, _id: userId });
});

// Get all users
app.get('/api/users', (req, res) => {
  res.json(users);
});

// Add an exercise for a user
app.post('/api/users/:_id/exercises', (req, res) => {
  const userId = req.params._id;
  const user = users.find(u => u._id === userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { description, duration, date } = req.body;
  const exerciseDate = date ? new Date(date) : new Date();

  if (isNaN(exerciseDate.getTime())) {
    return res.status(400).json({ error: 'Invalid date' });
  }

  const exercise = {
    description,
    duration: parseInt(duration, 10),
    date: exerciseDate.toDateString(),
  };

  if (!exercises[userId]) {
    exercises[userId] = [];
  }
  exercises[userId].push(exercise);

  res.json({
    username: user.username,
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date,
    _id: userId,
  });
});

// Get a user's exercise log
app.get('/api/users/:_id/logs', (req, res) => {
  const userId = req.params._id;
  const user = users.find(u => u._id === userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  let userExercises = exercises[userId] || [];
  const { from, to, limit } = req.query;

  if (from) {
    const fromDate = new Date(from);
    if (!isNaN(fromDate.getTime())) {
      userExercises = userExercises.filter(e => new Date(e.date) >= fromDate);
    }
  }

  if (to) {
    const toDate = new Date(to);
    if (!isNaN(toDate.getTime())) {
      userExercises = userExercises.filter(e => new Date(e.date) <= toDate);
    }
  }

  if (limit) {
    userExercises = userExercises.slice(0, parseInt(limit, 10));
  }

  res.json({
    username: user.username,
    count: userExercises.length,
    _id: userId,
    log: userExercises,
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
