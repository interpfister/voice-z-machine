const express = require('express')
const app = express()
const handler = require('./index').handler;
const bodyParser = require('body-parser');
app.use(bodyParser);

app.get('/', (req, res) => res.send('Hello World!'))

app.post('/', (req, res) => {
  const body = req.body;
  const event = {
    httpMethod: 'POST',
    body: JSON.stringify(body),
  }
  res.send(handler(event));
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Example app listening on port ${port}!`));