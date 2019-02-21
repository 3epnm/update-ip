var env = process.env.NODE_ENV || "development";
var config = require(__dirname + '/config/sender.json')[env];

var request = require('request');
var cronjob = require('cron').CronJob;

var job = new cronjob(config.cron, function () {
  request({
      method: 'GET',
      uri: config.uri,
      auth: config.auth,
      headers: {
        'x-sender': config.sender
      }
    },
    function (err, response, body) {
      if (err) {
        return console.error(err);
      }
      console.log(body);
    }
  );
});

job.start();

