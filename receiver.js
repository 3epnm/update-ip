var env = process.env.NODE_ENV || "development";
var config = require(__dirname + '/config/receiver.json')[env];

var redis = require("redis");
var express = require('express');
var moment = require('moment');

var passport = require('passport');
var BearerStrategy = require('passport-http-bearer').Strategy;

var client = redis.createClient(config.redis); 
var publish = redis.createClient(config.redis);

passport.use(new BearerStrategy(function (token, done) {
  if (token === config.auth.bearer) {
    done(null, true);
  } else {
    done(null, false);
  }
}));

var app = express();

app.get('/updateip/', passport.authenticate('bearer', { session: false }), function (req, res) {
    var ip = req.connection.remoteAddress;
    if (req.headers['x-forwarded-for']) {
        ip = ((req.headers['x-forwarded-for'].split(','))[0]).substr(7);
    }
    if (config.force) {
        ip = config.force;
    }

    var payload = moment().format() + ',' + ip;
    var key = 'server:' + req.headers['x-sender'];
 
    client.get(key, function (err, prev) {
        if (err) {
            return next.send(500, err);
        }
        
        console.log(payload, key);

        if (!prev || (prev && prev !== ip) || config.force) {
            publish.publish(key, ip);
        }
        client.set(key, ip);
        res.send(payload);
    });
});

app.listen(config.port, '0.0.0.0');
