document.addEventListener('DOMContentLoaded', () => {
  
  document.getElementById('addExerciseSubmit').addEventListener('click', () => {
    addExercise();
  });
  
  document.getElementById('createUserSubmit').addEventListener('click', () => {
    createUser();
  });
  
  document.getElementById('getExerciseSubmit').addEventListener('click', () => {
    getExercises();
  });
  
  //Get all users on page load
  getUsers();
});

function getUsers(){
  let url = "/api/exercise/users"
  fetch(url)
  .then((res) => res.json())
  .then((data) => {
    if(data !== null) {
      document.getElementById('userListContainer').innerHTML = '';
      let htmlList = `<h3>User List</h3><table border="1"><tr><th>UserName</th><th>UserID</th><th>Date Created</th></tr>`;
      data.forEach( (user) => {
        htmlList += `<tr id="${user._id}"><th>${user.username}</th><th>${user._id}</th><th>${new Date(user.createdDate)}</th></tr>`;
      });
    document.getElementById('userListContainer').innerHTML = htmlList;
    }
  })
  .catch(error => console.error('Error:', error)); 
}

function createUser(){
  let url = "/api/exercise/new-user"
  ,username = document.getElementById('createUserInput').value
  ,data = `username=${username}`;
  fetch(url, {
    method: "POST",
    headers: {
      'Content-Type':'application/x-www-form-urlencoded'
    },
    body: data,
  })
  .then((res) => res.json())
  .then((data) => {
    if(data.userID){
      console.log(`[createUser Response] ${JSON.stringify(data)}`);
      getUsers();
      displayModal("Exercise Saved Successfullly");
    }else{
      displayModal(data.Error);
    }
  })
  .catch(error => console.error('Error:', error)); 
}

function addExercise(){
  let url = '/api/exercise/add'
  ,userID = document.getElementById('addExerciseUserID').value
  ,desc = document.getElementById('addExerciseDesc').value
  ,duration = document.getElementById('addExerciseDuration').value
  ,currentDate;
  if(document.getElementById('addExerciseDate').value){
    let dateParts = document.getElementById('addExerciseDate').value.split('-');
    currentDate = new Date();
    currentDate.setFullYear(dateParts[0]);
    currentDate.setMonth(dateParts[1] -1);
    currentDate.setDate(dateParts[2]);
  }
  let data = `userID=${userID}&desc=${desc}&duration=${duration}&date=${currentDate}`;
  fetch(url, {
    method: "POST",
    headers: {
      'Content-Type':'application/x-www-form-urlencoded'
    },
    body: data,
  })
  .then((res) => res.json())
  .then((data) => {
    if(data.userID){
      console.log(`[addExercise] ${JSON.stringify(data)}`);
      displayModal("Exercise Saved Successfullly");
    }
    else {
     displayModal(data.Error); 
    }
  })
  .catch(error => console.error('Error:', error)); 
}

function getExercises(){
  console.log(`[GET-USER-EXERCISE-LOG]`);
  let userID = document.getElementById('getExerciseUserID').value
  ,from = document.getElementById('getExerciseFrom').value
  ,to = document.getElementById('getExerciseTo').value
  ,limit = document.getElementById('getExerciseLimit').value
  ,data = `userID=${userID}&from=${from}&to=${to}&limit=${limit}`
  ,url = '/api/exercise/log'
  fetch(url, {
    method: "POST",
    headers: {
      'Content-Type':'application/x-www-form-urlencoded'
    },
    body: data,
  })
  .then((res) => res.json())
  .then((data) => {
    console.log(`[Exercise Log] ${JSON.stringify(data)}`);
    if(data.userID !== undefined){
      let htmlList = `<h3>${data.username}'s Exercise Log (Excercise Count: ${data.exerciseCount})</h3><table border="1"><tr><th>Description</th><th>Duration (min)</th><th>Date</th></tr>`;
      data.exerciseArr.forEach( (e) => {
        htmlList += `<tr><th>${e.desc}</th><th>${e.duration}</th><th>${new Date(e.date).toLocaleDateString()}</th></tr>`;
      });
      document.getElementById('exerciseContainer').innerHTML = htmlList;
    }else{
      document.getElementById('exerciseContainer').innerHTML = '';
      displayModal(data.Error);
    }
  })
  .catch(error => console.error('Error:', error)); 
}
  
function displayModal(msg){
    let modal = document.getElementById('modalContainer')
    ,closeBtn = document.getElementById('closeButton')
    ,msgContainer = document.getElementById('modalMessage');
    
    msgContainer.innerHTML = msg;
    modal.style.display = 'block';
    
    closeBtn.onclick = () => {
     modal.style.display = "none"; 
    }
    
    window.onclick = (e) => {
      e.target == modal ? modal.style.display = "none" : '';
    }
}
