var path = require('path');
const express = require('express')
const serveStatic = require('serve-static')
const bodyParser = require("body-parser");
const mongoConnect = require('./mongoConnect');
const joinFiles = require('./joinFiles');

const app = express()

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

app.use('/', serveStatic(path.join(__dirname, '/web')))

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, '/web/index.html'))
})

app.post('/upload', function (req, res) {
    mongoConnect.insertFileWithNames(req.body.urlText, res);
})

app.post('/stopfetching', function (req, res) {
    mongoConnect.stopFetchingFiles(res).catch(console.error)
})

app.post('/downloadall', function (req, res) {
    mongoConnect.downloadAllVideos(res).catch(console.error)
})

app.post('/cutall', function (req, res) {
    mongoConnect.deleteAll(res).catch(console.error)
})

app.get('/filenames', function (req, res) {
    mongoConnect.getFileNames(res).catch(console.error)
})

app.post('/joinfiles', function (req, res) {
    joinFiles.createTextFile();
    joinFiles.joinFileAndGiveOutput()
    res.redirect('/')
})

const port = process.env.PORT || 8080
app.listen(port)
console.log(`app is listening on port: ${port}`)
