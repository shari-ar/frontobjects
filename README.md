*   [Tutorials](https://frontobjectsjs.com/Documentation/Tutorials)
    *   [Starting Line - frontend](https://frontobjectsjs.com/Documentation/Tutorials/Starting_Line_-_frontend)
    *   [Starting Line - backend](https://frontobjectsjs.com/Documentation/Tutorials/Starting_Line_-_backend)
    *   [Performance considerations](https://frontobjectsjs.com/Documentation/Tutorials/Performance_considerations)
*   [References](https://frontobjectsjs.com/Documentation/References)
*   [folib the library](https://frontobjectsjs.com/Documentation/folib_the_library)
*   [Donate](https://frontobjectsjs.com/Donate)

To write client-side code, almost like server-side languages
============================================================

also

A pure JavaScript template engine for express.js
------------------------------------------------

[Tutorials](https://frontobjectsjs.com/Documentation/Tutorials) [References](https://frontobjectsjs.com/Documentation/References) [folib the library](https://frontobjectsjs.com/Documentation/folib_the_library)

*   ### FrontObjectsJs is
    
    a structured way to organize HTML, CSS and JavaScript code using .jhtml and .jobj file formats. To start, simply write your html code in a .jhtml file in the form of blocks like this:
    
    Note: Before starting, you need to know HTML, CSS and JavaScript.
    
         html (lang="en") {
           head { }
           body {
              div { }
           }
        }  
    
*   Then add some JavaScript to it like this:
    
        html (lang="en") {
           head { }
           body {
              div { #result += "Hello World!";  }
           }
        } 
    
    Note: '#result' is a reserved word.
    
*   Then add the required amount of CSS:
    
        html (lang="en") {
           head { }
           body {
              div {
                 #result += 'Hello World!'; 
                 styles {
                    font-size: x-large;
                 } 
              }
           }
        } 
    

Well, now your webpage is ready. To avoid repetition and better readability, put a part of the code in a .jobj file. Just like you do in server-side languages. Suppose your .jobj file is located at the following relative path: parts/my-hello-part.jobj

  
  

Contents of Index.jhtml:

    html (lang="en") {
       head { }
       body { #parts.myHelloPart('Hello World!'); 
       }
    } 

Contents of parts/my-hello-part.jobj

     prop (txt) 
    div {
       #result += txt;
       styles { font-size: x-large; }
    } 

### FrontObjectsJs in action

To see FrontObjectsJs in action, you can take a look at one of the projects below, or even better, [see the full list of projects in 'Tutorials'.](https://frontobjectsjs.com/Documentation/Tutorials)

### Deep into FrontObjectsJs

And [to go deep into FrontObjectsJs, visit References.](https://frontobjectsjs.com/Documentation/References)

[What is FrontObjectsJs?](https://frontobjectsjs.com/Documentation/References#What_is_FrontObjectsJs?) [Jhtml](https://frontobjectsjs.com/Documentation/References#Jhtml) [Jobj](https://frontobjectsjs.com/Documentation/References#Jobj) [HTML Blocks](https://frontobjectsjs.com/Documentation/References#HTML_Blocks) [Jobj Call](https://frontobjectsjs.com/Documentation/References#Jobj_Call) [prop](https://frontobjectsjs.com/Documentation/References#prop) [#result](https://frontobjectsjs.com/Documentation/References##result) [return](https://frontobjectsjs.com/Documentation/References#return) [Dynamic Attributes](https://frontobjectsjs.com/Documentation/References#Dynamic_Attributes) [styles](https://frontobjectsjs.com/Documentation/References#styles) [\_\_dirname](https://frontobjectsjs.com/Documentation/References#__dirname) [Escape Character](https://frontobjectsjs.com/Documentation/References#Escape_Character)
