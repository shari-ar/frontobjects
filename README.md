To write client-side code, almost like server-side languages
============================================================ also A pure JavaScript template engine for express.js
------------------------------------------------

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



*   [Tutorials](https://frontobjectsjs.com/Documentation/Tutorials)
    *   [Starting Line - frontend](https://frontobjectsjs.com/Documentation/Tutorials/Starting_Line_-_frontend)
    *   [Starting Line - backend](https://frontobjectsjs.com/Documentation/Tutorials/Starting_Line_-_backend)
    *   [Performance considerations](https://frontobjectsjs.com/Documentation/Tutorials/Performance_considerations)
*   [References](https://frontobjectsjs.com/Documentation/References)
*   [folib the library](https://frontobjectsjs.com/Documentation/folib_the_library)
*   [Donate](https://frontobjectsjs.com/Donate)
