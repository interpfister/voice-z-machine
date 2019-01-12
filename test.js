const index = require("./index");
const yesno = require("yesno");
const debug = require("debug")("test");

if (!debug.enabled) {
  console.warn("debug not enabled - no console output will be displayed");
}

const body = {
  result: {
    resolvedQuery:
      process.argv.length > 2 ? process.argv.slice(2).join(" ") : "examine sky"
  },
  originalRequest: {
    source: "google",
    data: {
      user: {
        user_id: "test-user"
      }
    }
  }
};
const event = {
  httpMethod: "POST",
  body: JSON.stringify(body)
};

const callback = result => {
  debug("RESULT:", result);

  if (process.argv.length > 2 && process.argv[2] === "--pause") {
    yesno.ask(
      "Press enter to exit, or view the state actions at: http://remotedev.io/local/",
      true,
      () => {
        process.exit();
      }
    );
  } else {
    process.exit();
  }
};

index.handler(event).then(callback);
