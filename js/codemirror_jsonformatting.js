/*
 * CodeMirror's built-in pretty-print code is buggy and only adds line breaks, so this
 * overrides autoFormatLineBreaks to use Chris Dary's simpler and more thorough jsl.format.js:
 * https://github.com/umbrae/jsonlintdotcom/blob/c6284778ffa198c83ea4caca9fda791c6a0eb68b/c/js/jsl.format.js
 * 
*/
(function() {
  CodeMirror.extendMode("javascript", {
    autoFormatLineBreaks: function (text) {
      function repeat(s, count) {
        return new Array(count + 1).join(s);
      }

      function formatJson(json) {
           var i           = 0,
               il          = 0,
               tab         = "    ",
               newJson     = "",
               indentLevel = 0,
               inString    = false,
               currentChar = null;

           for (i = 0, il = json.length; i < il; i += 1) { 
               currentChar = json.charAt(i);

               switch (currentChar) {
               case '{': 
               case '[': 
                   if (!inString) { 
                       newJson += currentChar + "\n" + repeat(tab, indentLevel + 1);
                       indentLevel += 1; 
                   } else { 
                       newJson += currentChar; 
                   }
                   break; 
               case '}': 
               case ']': 
                   if (!inString) { 
                       indentLevel -= 1; 
                       newJson += "\n" + repeat(tab, indentLevel) + currentChar; 
                   } else { 
                       newJson += currentChar; 
                   } 
                   break; 
               case ',': 
                   if (!inString) { 
                       newJson += ",\n" + repeat(tab, indentLevel); 
                   } else { 
                       newJson += currentChar; 
                   } 
                   break; 
               case ':': 
                   if (!inString) { 
                       newJson += ": "; 
                   } else { 
                       newJson += currentChar; 
                   } 
                   break; 
               case ' ':
               case "\n":
               case "\t":
                   if (inString) {
                       newJson += currentChar;
                   }
                   break;
               case '"': 
                   if (i > 0 && json.charAt(i - 1) !== '\\') {
                       inString = !inString; 
                   }
                   newJson += currentChar; 
                   break;
               default: 
                   newJson += currentChar; 
                   break;                    
               } 
           } 

           return newJson; 
       }
       return formatJson(text);
    }
  });
})();
