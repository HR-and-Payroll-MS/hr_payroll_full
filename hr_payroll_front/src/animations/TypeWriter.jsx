import React from 'react'

function TypeWriter() {
const words = ["Hello, World!", "Welcome to my Website!", "This is a typewriter effect."];
let i = 0;
let j = 0;
let currentWord= "";
let isDeleting = false;
function type(){
currentWord = words[i]
if(isDeleting){ 
    document.getElementById("typewriter").textContnt = currentWord.substring(0,j-1);
    j--;
    if(j == 0){
        isDeleting = false;
        i++;
        if( i == words.length){
            i=0;
        }
    }
    } else {
        document.getElementById("typeWriter").textContent = currentWord.substring(0,j+1);
        j++;
        if( j == currentWord.length){
            isDeleting = true;
        }

        setTimeout(() => {
            type()
        }, 100);
    }
  return (
    <div className='w-full h-full flex justify-center items-center'>
        <h1 id="typeWriter" class = "text-4xl font-bold"></h1>
    </div>
  )
}}

export default TypeWriter