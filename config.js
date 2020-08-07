  
import * as firebase from 'firebase'
require('@firebase/firestore')


  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  const firebaseConfig = {
    apiKey: "AIzaSyBbYQSr9ws9jBBUy6n-FCCnAJpp_B2P_kk",
    authDomain: "willy-app-2a1d6.firebaseapp.com",
    databaseURL: "https://willy-app-2a1d6.firebaseio.com",
    projectId: "willy-app-2a1d6",
    storageBucket: "willy-app-2a1d6.appspot.com",
    messagingSenderId: "740324363308",
    appId: "1:740324363308:web:01aad305cdffa25b731589"
  };
  export default firebase.firestore();