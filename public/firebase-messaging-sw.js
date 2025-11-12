// firebase-messaging-sw.js

// Import Firebase scripts for background messaging
importScripts("https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js");

// Initialize Firebase inside the service worker
firebase.initializeApp({
  apiKey: "AIzaSyCRg4JU0diYtvklcC3BrFeQgBTyY3gIF-c",
  authDomain: "kvsbandhan-306c2.firebaseapp.com",
  projectId: "kvsbandhan-306c2",
  messagingSenderId: "625135740863",
  appId: "1:625135740863:web:92f0f54300e3eb4f49e30a"
});

// Retrieve messaging instance
const messaging = firebase.messaging();
