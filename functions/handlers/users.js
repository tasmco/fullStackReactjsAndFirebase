const { db } = require("/Users/TASM/Desktop/soicalapeth-functions/util/admin");

const config = require("/Users/TASM/Desktop/soicalapeth-functions/util/config");

const firebase = require("firebase");
firebase.initializeApp(config);

const {validateSignupData, validataeLoginData} = require('/Users/TASM/Desktop/soicalapeth-functions/util/validators');

exports.signup = (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle
  };

  const {valid , errors} = validateSignupData(newUser);

  if(!valid) return res.status(400).json(errors);

//   let errors = {};
//   if (isEmpty(newUser.email)) {
//     errors.email = "Must not be empty";
//   } else if (!isEmail(newUser.email)) {
//     errors.email = "Must be a valid email address";
//   }

//   if (isEmpty(newUser.password)) errors.password = "Must not be empty";
//   if (newUser.password !== newUser.confirmPassword)
//     errors.confirmPassword = "Password must match";
//   if (isEmpty(newUser.handle)) errors.handle = "Must not be empty";

//   if (Object.keys(errors).length > 0) return res.status(400).json(errors);
//   //todo validate data
  let token, userId;

  db.doc(`/users/${newUser.handle}`)
    .get()
    .then(doc => {
      if (doc.exists) {
        return res.status(400).json({ handle: "this handle is already taken" });
      } else {
        return firebase
          .auth()
          .createUserWithEmailAndPassword(newUser.email, newUser.password);
      }
    })
    .then(data => {
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    .then(idToken => {
      token = idToken;
      const userCredentials = {
        handle: newUser.handle,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        userId
      };
      return db.doc(`/users/${newUser.handle}`).set(userCredentials);
    })
    .then(data => {
      return res.status(201).json({ token });
    })
    .catch(err => {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        return res.status(400).json({ email: "Email is already is use" });
      } else {
        return res.status(500).json({ error: err.code });
      }
    });
};

exports.login = (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password
  };

  const {valid , errors} = validateLoginData(user);

  if(!valid) return res.status(400).json(errors);

  
  firebase
    .auth()
    .signInWithEmailAndPassword(user.email, user.password)
    .then(data => {
      return data.user.getIdToken();
    })
    .then(token => {
      return res.json({ token });
    })
    .catch(err => {
      console.error(err);
      if (err.code === "auth/wrong-password") {
        return res
          .status(403)
          .json({ general: "Wrong credentials , plz try again" });
      } else return res.status(500).json({ error: err.code });
    });
};
