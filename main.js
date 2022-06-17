import "./style.css";
import { db, colRef } from "./db";
import { addDoc, updateDoc } from "firebase/firestore";

//dom elements
const btns = document.querySelectorAll("button");
const form = document.querySelector("form");
const formAct = document.querySelector("form span");
const input = document.querySelector("input");
const error = document.querySelector(".error");

export let activity = "cycling";

btns.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    //get activity
    activity = e.target.dataset.activity;

    //remove and add active class
    btns.forEach((btn) => {
      btn.classList.remove("active");
    });
    e.target.classList.add("active");

    //set id of input field
    input.setAttribute("id", activity);

    //set text of form span
    formAct.textContent = activity;
  });
});

//form submit
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const distance = parseInt(input.value);

  if (distance) {
    addDoc(colRef, { distance, activity, date: new Date().toString() }).then(
      () => {
        error.textContent = "";
        input.value = "";
      }
    );
  } else {
    error.textContent = "please enter a valid distance";
  }
});
