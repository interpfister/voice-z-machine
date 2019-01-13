# voice-z-machine

Enables playing z-machine games via a webservice. POST a query using Diaglow syntax and get a response from the z-machine.

There are other z-machine web service routers out there, but the big advantage of this one is it's stateless. We don't need to keep a console process running for each new user - each time, we launch the game, get the output, and then save the game again. That should enable better scalability.

To accomplish this, this script:

- Calls DynamoDB to figure out what game you were playing.
- Loads your save game file from s3.
- Invokes the z-machine on the command line and captures the output.
- Saves the game again and uploads to s3.
- Returns the output as a string in a JSON object.

1/12/2019 Update: I've converted to using a ["dumb" interface](https://github.com/jwoos/javascript_frotz) in hopes of better handling in-game sleep scenarios and to improve performance.

I created this so I could play z-machine games via Google Assistant and Slack.

Google Assistant is especially cool because you can play while walking around using your voice.

Three games currently supported. Pull requests welcome for more. Props to the original game authors:

- [Lost Pig](http://ifdb.tads.org/viewgame?id=mohwfk47yjzii14w) by Admiral Jota
- [Anchorhead](http://ifdb.tads.org/viewgame?id=op0uw1gn1tjqmjt7) by Michael Gentry

See my [Medium Post](https://medium.com/@interpfister/interactive-audiobooks-playing-text-adventure-games-with-your-voice-using-google-assistant-heroku-9c565acf4072) for more background.

Slack bot is live! Get it here:

<a href="https://slack.com/oauth/authorize?client_id=269195122228.272201929431&scope=bot"><img alt="Add to Slack" height="40" width="139" src="https://platform.slack-edge.com/img/add_to_slack.png" srcset="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x" /></a>

You can also tweet @SpeakYourOwnAdv: https://twitter.com/SpeakYourOwnAdv
