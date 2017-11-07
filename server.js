const express = require('express')
const app = express()
const handler = require('./index').handler;
const bodyParser = require('body-parser');

const jsonParser = bodyParser.json();

app.get('/', (req, res) => res.send('Hello World!'))

app.post('/', jsonParser, (req, res) => {
  const body = req.body;
  const event = {
    httpMethod: 'POST',
    body: JSON.stringify(body),
  }
  
  const callback = (something, result) => {
    res.send(result.body);
  }
  console.log(`calling handler with: ${body}`);
  handler(event, {}, callback);
});

process.on('uncaughtException', function(err) {
  console.log('Caught exception: ' + err);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Example app listening on port ${port}!`));