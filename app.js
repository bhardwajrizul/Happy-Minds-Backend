const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

app.use(cors());

const users = [
  {
    id: 1,
    username: 'user1',
    password: 'password', // password
    streak: 0
  },
  {
    id: 2,
    username: 'user2',
    password: 'password',
    streak: 0
  }
];

const secret = 'secret_key'; 



const checkCookie = (req, res, next) => {
  const token = req.cookies.MENTAL_COOKIE;

  if (!token) {
    req.auth = 'false';
    return next(); 
  }

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      req.auth = 'false';
      return next(); 
    }

    const user = users.find((u) => u.id === decoded.id);

    if (!user) {
      req.auth = 'false';
      return next(); 
    }
    req.user = user;
    req.auth = 'true';
    next();
  });
};

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find((u) => u.username === email);

  console.log(email, password);

  if (!user) {
    return res.status(404).json({message: "No User Found"});
  }

  // bcrypt.compare(password, user.password, (err, result) => {
  //   if (err) {
  //     return res.status(500).json({message: "Internal Server Error"});
  //   }

  //   if (!result) {
  //     return res.status(401).json({message: "Incorrect Email or Password"});
  //   }

  //   const token = jwt.sign({ id: user.id }, secret, { expiresIn: '1h' });
  //   res.cookie('MENTAL_COOKIE', token, { httpOnly: true, maxAge: 3600000 }); // 1HR
  //   res.status(200).json({message: 'Login Successful'});
  // });

  if (password == user.password) {
    const token = jwt.sign({ id: user.id }, secret, { expiresIn: '1h' });
    res.cookie('MENTAL_COOKIE', token, { httpOnly: true, maxAge: 3600000 }); // 1HR
    res.status(200).json({message: 'Login Successful'});
  } else {
    res.status(403).json({message: 'Either Username or Password is Incorrect'});
  }

});

app.post('/signup', (req, res) => {
  const { email, password, passwordConfirm } = req.body;
  // check if user exists
  let user = users.find((u) => u.username === email);
  if (user) {
    return res.status(401).json({message: "User already has an account"})
  }
  else if (password !== passwordConfirm) {
    return res.status(401).json({message: "Passwords do not match"})
  }
  // CREATE A NEW USER
  users.push({id: users.length + 1, username: email, password: password})
  user = users[users.length - 1]
  const token = jwt.sign({ id: user.id }, secret, { expiresIn: '1h' });
  res.cookie('MENTAL_COOKIE', token, { httpOnly: true, maxAge: 3600000 }); // 1HR
  res.status(200).json({message: 'Signup Successful'});
});

app.post('/logout', (req, res) => {
  res.clearCookie('MENTAL_COOKIE');
  res.status(200).json({message: 'User logged out'});
});

app.post('/incStreak', checkCookie, (req,res)=>{
  if (req.auth == "true") {
    const user = users.find((u) => u.id === req.user.id);
    user.streak++;
    res.status(200).json({message: `${user.streak}`})
  }
})



app.get('/dashboard', checkCookie,  (req, res) => {
  if (req.auth === 'false') {
    res.redirect('/auth');
  } else {
    
    res.sendFile(__dirname + '/public/dashboard.html', (err) => {
      console.log(err)
    })
  }
});

app.get('/auth', checkCookie, (req, res) => {
  if (req.auth === 'false') {
    res.sendFile(__dirname + '/public/index.html', (err) => {
      if (err)
        console.log(err);
    })
  } else {
    res.redirect('/dashboard');
  }
});


const host = '0.0.0.0';
const port = process.env.PORT || 3000;

app.listen('3000',() => {
  console.log(`Server Started at http://${host}:${port}`)
});

