const express = require("express");
const app = express();
const handler = require("./index").handler;
const bodyParser = require("body-parser");
const debug = require("debug")("server");

const jsonParser = bodyParser.json();

app.use(express.static("public"));

app.get("/slack-install", (req, res) =>
  res.redirect(
    "https://slack.com/oauth/authorize?client_id=269195122228.272201929431&scope=bot"
  )
);

app.post("/", jsonParser, (req, res) => {
  const body = req.body;
  const event = {
    httpMethod: "POST",
    body: JSON.stringify(body)
  };

  let responseSent = false;
  const callback = (something, result) => {
    if (!responseSent) {
      responseSent = true;
      res.send(result.body);
    } else {
      debug("Response callback unexpectedly called a second time.");
    }
  };
  debug(`calling handler with: ${body}`);
  handler(event, {}, callback);
});

process.on("uncaughtException", function(err) {
  debug("Caught exception: " + err);
});

const port = process.env.PORT || 3000;
app.listen(port, () => debug(`Example app listening on port ${port}!`));
