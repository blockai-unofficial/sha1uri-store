var AWS_ACCESS_KEY_ID =  process.env.AWS_ACCESS_KEY_ID;
var AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
var PORT = process.env.PORT || 3434;

var dynamodb =  require('dynamodb');
var connect = require('connect');
var connectRoute = require('connect-route');
var http = require('http');
var request = require('request');
var shasum = require('shasum');
var cors = require('cors');

var ddb = dynamodb.ddb({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY
});

ddb.createTable('sha1uri', {
    hash: ['uri', ddb.schemaTypes().string],
    range: ['sha1', ddb.schemaTypes().string]
  },
  {
    read: 10,
    write: 10
  }, function(err, details) {
    //console.log(err, details);
});

var app = connect();

app.use(cors());

app.use(connectRoute(function (router) {
  router.get('/uri/:uri', function (req, res, next) {
    var uri = decodeURIComponent(req.params.uri);
    ddb.query('sha1uri', uri, {}, function(err, resp, cap) {
      if (resp && resp.items && resp.items[0] && resp.items[0].sha1) {
        var sha1 = resp.items[0].sha1;
        //console.log("got uri:", uri, "sha1:", sha1);
        res.end(sha1);
      }
      else {
        request({url:uri, encoding: null}, function(err, resp, body) {
          if (err) return next(err);
          var sha1 = shasum(body);
          ddb.putItem('sha1uri', {uri:uri, sha1:sha1}, {}, function(err, res, cap) {
            //console.log("put uri:", uri, "sha1:", sha1);
          });
          res.end(sha1);
        });
      }
    });
  });
}));

http.createServer(app).listen(PORT)