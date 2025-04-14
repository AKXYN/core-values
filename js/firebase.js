const firebaseConfig = {
    apiKey: "AIzaSyCuRBnVEgZ4EVFi6ZvIthFm_IUsLxD22bc",
    authDomain: "corevaluesapp-9ca55.firebaseapp.com",
    projectId: "corevaluesapp-9ca55",
    storageBucket: "corevaluesapp-9ca55.firebasestorage.app",
    messagingSenderId: "894079508319",
    appId: "1:894079508319:web:8c7cc5a0389b87939d20ea"
  };

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();