// require and instantiate express
var express = require('express');
var app = express();
const codecUrl = require('./utils/codec-url');
const exphbs = require('express-handlebars');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('./db/urls', ()=>{console.log('Database opened successfully')});
//bodyparser
const bodyParser = require('body-parser');

//set static directory
app.use('/static',express.static(__dirname + '/public'));
//define bodyParser middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
//define render engine
const hbs = exphbs.create({
    extname:'hbs',
    defaultLayout:'layout',
    layoutsDir:__dirname + '/views/layouts/',
});

app.engine('hbs',hbs.engine);
app.set('views', __dirname + '/views');
app.set('view engine', 'hbs');
app.get('/', function(req, res){
  // route to serve up the homepage (index.html)
  res.render('index');
});
//------
function setShortUrl(res, cond){
    db.run('UPDATE url_shortener set short_url = $encoded WHERE id = $id',
        cond,
        function(error){
            if(error){
                res.render('index', {msg:'Não foi possível encurtar a URL'});
                return;
            }
            res.render('index', {msg:'URL Encurtada: ' + encoded});
        }
    );
}

function saveUrl(res, data){
            db.run('INSERT INTO url_shortener(long_url) values($longUrl)',
            {
                $longUrl: data
            }, 
            function(error){
                if(error){
                    res.render('index', {msg:'Não foi possível encurtar a URL'});
                    return;
                }
                lastID = this.lastID
                encoded = codecUrl.encode(lastID);

                let cond = {
                    $encoded:encoded,
                    $id: lastID
                };
                setShortUrl(res,cond);
        });
}

function redirectUrl(res, encoded){
    let cond = {
        $encoded: encoded
    };
    db.get('select * from url_shortener where short_url = $encoded',
            cond,
            function(error, row){
                if(error || !row){
                    res.render('index', {msg:'Não foi possível encurtar a URL'});
                    return;
                }
                res.redirect(row.long_url);
        });
}
app.post('/url/shorten', function(req, res){
  db.serialize(function(){
        let encoded = null;
        let lastID = null;
        saveUrl(res, req.body['long-url']);
  });
});

app.get('/url/redirect/:encoded', function(req, res){
    db.serialize(function(){
        redirectUrl(res, req.params.encoded);
    });
});

app.get('/url', function(req,res){
    db.all('select * from url_shortener where short_url is not null',
            function(error, rows){
                if(error || !rows){
                    res.render('index', {msg:'Não foi possível obter a URL'});
                    return;
                }
                res.render('index', {urls: rows});
        });
});

var server = app.listen(3000, function(){
  console.log('Server listening on port 3000');
});