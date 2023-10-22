var express = require('express');
var router = express.Router();

/* GET simple message */
router.get('/', function(req, res, next) {
  // send 200 response just to verify microservice working
  res.status(200).send({"status": "200", "message": "Working..."});
});

module.exports = router;
