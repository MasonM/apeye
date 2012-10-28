/*
This is a copy-and-paste of codemirror/lib/util/formatting.js, with some changes so it can autoformat JSON nicely
Modified lines are marked with //MODIFIED
*/
(function() {
  function jsNonBreakableBlocks(text) {
    var nonBreakableRegexes = [/for\s*?\((.*?)\)/,
                               /\"([^"]*)(\"|$)/, //MODIFIED
                               /\'([^']*)(\'|$)/, //MODIFIED
                               /\/\*(.*?)(\*\/|$)/,
                               /\/\/.*/];
    var nonBreakableBlocks = [];
    for (var i = 0; i < nonBreakableRegexes.length; i++) {
      var curPos = 0;
      while (curPos < text.length) {
        var m = text.substr(curPos).match(nonBreakableRegexes[i]);
        if (m != null) {
          nonBreakableBlocks.push({
            start: curPos + m.index,
            end: curPos + m.index + m[0].length
          });
          curPos += m.index + Math.max(1, m[0].length);
        }
        else { // No more matches
          break;
        }
      }
    }
    nonBreakableBlocks.sort(function (a, b) {
      return a.start - b.start;
    });

    return nonBreakableBlocks;
  }

  CodeMirror.extendMode("javascript", {
    commentStart: "/*",
    commentEnd: "*/",
    wordWrapChars: [";", ",", "[", "]", "\\{", "\\}"], //MODIFIED

    autoFormatLineBreaks: function (text) {
      var curPos = 0;
      var reLinesSplitter = /([;,\{\}\[\]])([^\r\n;]|$)/g; //MODIFIED
      var reLinesClosingBraceSplitter = /([^\}]|^)(\})/g; //MODIFIED
      var nonBreakableBlocks = jsNonBreakableBlocks(text);
      if (nonBreakableBlocks != null) {
        var res = "";
        for (var i = 0; i < nonBreakableBlocks.length; i++) {
          if (nonBreakableBlocks[i].start > curPos) { // Break lines till the block
            res += text.substring(curPos, nonBreakableBlocks[i].start).replace(reLinesSplitter, "$1\n$2").replace(reLinesClosingBraceSplitter, "$1\n$2"); //MODIFIED
            curPos = nonBreakableBlocks[i].start;
          }
          if (nonBreakableBlocks[i].start <= curPos
              && nonBreakableBlocks[i].end >= curPos) { // Skip non-breakable block
            res += text.substring(curPos, nonBreakableBlocks[i].end);
            curPos = nonBreakableBlocks[i].end;
          }
        }
        if (curPos < text.length)
          res += text.substr(curPos).replace(reLinesSplitter, "$1\n$2").replace(reLinesClosingBraceSplitter, "$1\n$2"); //MODIFIED
        return res;
      } else {
        return text.replace(reLinesSplitter, "$1\n$2").replace(reLinesClosingBraceSplitter, "$1\n$2"); //MODIFIED
      }
    }
  });
})();
