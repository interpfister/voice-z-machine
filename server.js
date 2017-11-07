const express = require('express')
const app = express()
const handler = require('./index').handler;

app.get('/', (req, res) => res.send('Hello World!'))

app.post('/', (req, res) => {
  const body = req.body;
  const event = {
    httpMethod: 'POST',
    body: JSON.stringify(body),
  }
  res.send(handler(event));
});

app.listen(3000, () => console.log('Example app listening on port 3000!'))