const fs = require('fs');
const { exec } = require('child_process');

const IP_BLOCK_THRESHOLD = 20;
const IP_BLOCK_DURATION = 600; // 10 minutes in seconds
const ipStatusCounter = {}; // To store IP status code count

// Read the file and store its contents
let fileList = [];
fs.readFile('list.txt', 'utf8', (err, data) => {
  if (!err) {
    fileList = data.split('\n');
  }
});
// Middleware to count and block IPs based on the response status code
const statusCounterMiddleware = (req, res, next) => {
    const ip = req.ip;
    const currentTime = Date.now();
    
    if (!ipStatusCounter[ip]) {
      ipStatusCounter[ip] = [];
    }
    
    // Remove status records older than 1 minute
    ipStatusCounter[ip] = ipStatusCounter[ip].filter(entry => currentTime - entry.timestamp <= 60000);
    
    if (res.statusCode !== 200) {
      ipStatusCounter[ip].push({ timestamp: currentTime});
    }
    
    const failedCount = ipStatusCounter[ip].length;
    
    if (failedCount >= IP_BLOCK_THRESHOLD) {
      exec(`iptables -I INPUT -m recent --set --name BLACKLIST --rsource ${ip} -j DROP`, () => {});
      exec(`iptables -C INPUT -m recent --rcheck --seconds ${IP_BLOCK_DURATION} --name BLACKLIST --rsource ${ip} -j DROP`, () => {});
      return
    }
    
    next();
};
  
app.use(statusCounterMiddleware);

