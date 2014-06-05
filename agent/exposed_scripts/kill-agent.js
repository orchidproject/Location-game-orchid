var exec = require("child_process").exec;
var fs = require("fs"); 
var pids =fs.readFileSync("./agent/pids.txt","utf-8");
console.log(pids);
pids = pids.split(",");

for( i=0; i< pids.length; i++){
  exec("kill " + pids[i]);
}
