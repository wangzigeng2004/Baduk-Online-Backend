var express = require('express')
var bodyParser = require('body-parser')
var cors = require('cors');
var app = express()
app.use(cors({origin: '*'}));
var http = require('http').Server(app)
app.use('/static', express.static('public'))
app.set('view engine', 'jade');

app.use(express.static(__dirname))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

// app.get('/room/:roomId', (req, res) => {
//     var roomId = req.params.roomId
//     res.send(`welcome to game room: ${roomId}`)
// })

var io = require('socket.io')(http)
// io.origins('*:*')
var mongoose = require('mongoose')
mongoose.Promise = Promise

// var dbUrl = 'mongodb://localhost:27017/baduk_online'
var dbUrl = 'mongodb+srv://user:user@cluster0.4o6w5.mongodb.net/messages?retryWrites=true&w=majority'

var Message = mongoose.model('Message', {
    name: String,
    message: String
})

app.get('/messages', (req, res) => {
    Message.find({}, (err, messages) => {
        res.send(messages)
    })
})

app.get('/messages/:user', (req, res) => {
    var user = req.params.user
    Message.find({name: user}, (err, messages) => {
        res.send(messages)
    })
})

app.post('/messages', async (req, res) => {
    try {
        var message = new Message(req.body)

        var savedMessage = await message.save()

        console.log('saved')

        var censored = await Message.findOne({ message: 'badword' })

        if (censored)
            await Message.remove({ _id: censored.id })
        else
            io.emit('message', req.body)

        res.sendStatus(200)
    } catch (error) {
        res.sendStatus(500)
        return console.error(error)
    } finally {
        console.log('message post called')
    }
})



io.on('connection', (socket) => {
    console.log('a user connected')
    socket.on('move', data => {
        const { sign, x, y } = data;
        console.log(`received move sign: ${sign}, [x,y]: [${x}, ${y}]`);
        socket.emit('move', {sign: sign*-1, x:1, y:1})
    })
})

mongoose.connect(dbUrl, { useNewUrlParser: true }, (err) => {
    console.log('mongo db connection', err)
})

app.use(function(req, res, next) {
    req.io = io;
    next();
});
const routes = require('./routes'); //导入自定义路由文件，创建模块化路由
app.use('/', routes);

var server = http.listen(7777, () => {
    console.log('server is listening on port', server.address().port)
})


// module.exports = function(io) {
//     let router = express.Router()
//
//     // define routes
//     // io is available in this scope
//     router.get(...)
//
//     return router;
// }
// app.set("io", io);
// module.exports = app;