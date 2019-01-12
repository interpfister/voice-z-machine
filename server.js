const express = require('express')
const app = express()
const handler = require('./index').handler;
const bodyParser = require('body-parser');
const debug = require('debug')('server');

const jsonParser = bodyParser.json();

app.get('/', (req, res) => res.send('Hello World!'))

app.post('/', jsonParser, (req, res) => {
  const body = req.body;
  const event = {
    httpMethod: 'POST',
    body: JSON.stringify(body),
  }
  
  let responseSent = false;
  const callback = (something, result) => {
    if(!responseSent) {
      responseSent = true;
      res.send(result.body);
    } else {
      debug('Response callback unexpectedly called a second time.');
    }
  }
  debug(`calling handler with: ${body}`);
  handler(event, {}, callback);
});

process.on('uncaughtException', function(err) {
  debug('Caught exception: ' + err);
});

const port = process.env.PORT || 3000;
app.listen(port, () => debug(`Example app listening on port ${port}!`));