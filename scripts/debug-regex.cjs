var line = "src/components/AddKeyModal/AddKeyModal.tsx(10,23): error TS6133: 'flexColGap4' is declared but its value is never read.\r";
console.log('Full no $:', /^(.+?)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.+)/.test(line));
console.log('Full with $:', /^(.+?)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.+)$/.test(line));

// Test raw:
var m = /^(.+)$/.exec("foo\r");
console.log('Simple foo test:', m ? 'match: ' + JSON.stringify(m[1]) : 'no');

var m2 = /^(.+?):\s+(.+)$/.exec("foo: bar\r");
console.log('Split test:', m2 ? 'match: ' + JSON.stringify(m2[2]) : 'no');
