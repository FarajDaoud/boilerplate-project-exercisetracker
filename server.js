const express = require('express')
const app = express()
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const cors = require('cors')

mongoose.connect(process.env.MONGO_URI, {
  useMongoClient: true,
});
var db = mongoose.connection; 
db.on("error", console.error.bind(console, "connection error"));

const Schema = mongoose.Schema;

//Create user and exercise Schema

const userSchema = new Schema({
  _id: Schema.Types.ObjectId,
  username: {type: String},
  exercises: [{ type: Schema.Types.ObjectId, ref: 'Excercise' }],
  createdDate: { type: Date, default: Date.now },
});

const exerciseSchema = new Schema({
  userID: {type: Schema.Types.ObjectId, ref: 'User'},
  desc: String,
  duration: Number,
  date: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema, 'users');
const Exercise = mongoose.model('Exercise', exerciseSchema, 'exercises');

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
//app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

//return array of all users [{username: '', ...}, ...]
app.get('/api/exercise/users/', (req, res) => {
  console.log(`[GET-ALL-USERS]`);
  User.find({}, (err, data) => {
    if(err) res.send({Error: err});
    let userArr = [];
    data.forEach((user) => {
      userArr.push(user);
    });
    res.send(userArr);
  }).sort({ username: 1 });
});

//Create a user
//input: username
//output: {_id: '', username: '', createdDate: ''}
app.post('/api/exercise/new-user', (req, res) => {
  console.log(`[POST-CREATE-USER] ClientBody: ${JSON.stringify(req.body)}`);
  if(req.body.username){
    let username = req.body.username;
    User.findOne({username: username}, (err, data) => {
      if(err) res.send({Error: err});
      if(data !== null){
        let userID = data._id;
        res.send({userID: userID, username: username, createdDate: data.createdDate});
      }
      else{
        let newUser = new User({
          _id: new mongoose.Types.ObjectId(),
          username: username,
        });
          newUser.save(newUser, (err, data) => {
            if(err) res.send({Error: err});
            res.send({userID: data._id, username: username, createdDate: data.createdDate});
          });
      }
    });
  }
  else {
    res.send({Error: 'Please provide a username.'}); 
  }
});

//Add an excercise to a user.
//input: userId(_id), description, duration, and optionally date. 
//output: user object with exercise fields added.
app.post('/api/exercise/add', (req, res) => {
  console.log(`[POST-ADD-EXERCISE] ClientBody: ${JSON.stringify(req.body)}`);
  if(req.body.userID && req.body.desc && req.body.duration){
    let userID = req.body.userID
    ,desc = req.body.desc
    ,duration = req.body.duration;
    
    let date;
    if(req.body.date !== 'undefined'){
      if(req.body.date.toString() !== 'Invalid Date'){
        date = req.body.date;
      }else{
         res.send({Error: 'Invalid date format. expected: YYYY-MM-DD'});
          return;
      }
    }
    else{
      date = new Date();
    }
    
    let newExercise = new Exercise({
      userID: userID,
      desc: desc,
      duration: duration,
      date: date,
    });
    newExercise.save(newExercise, (err, data) => {
      if(err) res.send({Error: err});
      res.send({userID: data.userID, desc: data.desc, duration: data.duration, date: data.date});
    });
  }else{
    res.send({Error: "Please provide the userID, description, and duration of the exercise"}); 
  }
});

//Get a user's exercise log.
//Input: _id, optional: from, to, limit
//output: {user parameters, exerciseLog: [], exerciseCount: int}
app.post('/api/exercise/log', (req, res) => {
  console.log(`[GET-USER-EXCERCISE-LOG] ClientParams: ${JSON.stringify(req.body)}`);
  if(mongoose.Types.ObjectId.isValid(req.body.userID)){
    let from = req.body.from ? new Date(req.body.from) : null
    ,to = req.body.to ? new Date(req.body.to) : null
    ,limit = req.body.limit ? parseInt(req.body.limit) : 0
    ,date = {};
    let query = {userID: req.body.userID,};
    if(from && from.toString() !== 'Invalid Date'){
      date.$gte = from;
    }
    if(to && to.toString() !== 'Invalid Date'){
      to.setHours(24);
      date.$lte = to; 
    }
    if(date.$gte || date.$lte) query.date = date;
    console.log(query);
    Exercise.find(query)
      .limit(limit)
      .sort({ date: -1 })
      .exec((err, data) => {
        if(err) res.send({Error: err});
        console.log(`[EXERCISES] ${data}`);
        if(data !== null){
          console.log('data !== null');
          let exerciseArr = [];
          let exerciseCount = 0;
          data.forEach((e) => { 
            exerciseArr.push({desc: e.desc, duration: e.duration, date: e.date}); 
            exerciseCount++;
          });
          User.findOne({_id: req.body.userID}, (err, data) => {
            if(err) res.send({Error: err});
            res.send({username: data.username, userID: data._id, exerciseArr: exerciseArr, exerciseCount: exerciseCount});
          });
        }else{
          res.send({Error: "User has not logged an exercise."}); 
        }
      })
  }else{
    res.send({Error: "Please provide a valid user ID."}); 
  }
});


// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('#################################################################');
  console.log('Your app is listening on port ' + listener.address().port)
})


