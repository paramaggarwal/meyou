var express = require('express');
var jade = require('jade');
var mongo = require('mongoskin');
var nodemailer = require('nodemailer');
var config = require('./config')

var mdb = mongo.db('paramaggarwal:' + config.mongodb_pass + '@staff.mongohq.com:10085/meyouapp');

mdb.bind('users');
mdb.bind('messages');			

var app = express();
app.set('view engine', 'jade');
app.set('view options', {layout: false});

app.use(express.logger());
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({ secret: config.express_secret }));
app.use(app.router);
app.use(express.static(__dirname + '/public'));
app.use(express.favicon());
//app.use(express.errorHandler());

app.get('/', function(request, response) {
        if (request.session.user) {
        mdb.messages
        .find({receipient: request.session.user})
        .toArray(function(err, doc) { 
                 response.render('user', {user: request.session.user, messages: doc} );
                 });
        } else {
        response.render('index');
        }	
        });

app.get('/all', function(request, response) {        
		mdb.messages
		.find()
		.toArray(function(err, doc) {
				 response.write('<html><body>');
				 for(var i=0; i < doc.length; i++) {
				 response.write('Message from <b>' + doc[i].sender + '</b> for <b>' + doc[i].receipient + '</b>: <i>' + doc[i].message + '</i><br>');
				 }
				 response.write('<br><br>');
				 mdb.users
				 .find()
				 .toArray(function(err, doc) {
						  for(var i=0; i < doc.length; i++) {
						  response.write('Username: <b>' + doc[i].nickname + '</b> and password: <b>' + doc[i].password + '</b><br>');
						  }
						  response.write('</body></html>');
						  response.end();
						  });
				 });
		});

app.post('/register', function(request, response){
         var data = request.body;
         mdb.users
		 .find({nickname: data.nickname})
		 .toArray(function(err, doc) {
				  if(doc != 0) {
				  response.render('index', {flash: 'Nickname is in use'});
				  
				  } else if(data.password != data.confirm_password) {
				  response.render('index', {flash: 'Password does not match'});
				  
				  } else {
				  delete data.confirm_password;
				  mdb.users
				  .save(data, 
						function(db_err, db_res) {
						request.session.user = data.nickname;
                        response.redirect('/');
						});
				  }
				  });
         });

app.post('/login', function(request, response){
         var data = request.body;
         mdb.users
		 .find({nickname: data.nickname})
		 .toArray(function(err, doc) {   
				  if(!(doc != 0)) { 
				  response.render('index', {flash: 'No user found'}); 
				  } else if(doc[0].password != data.password) { 
				  response.render('index', {flash: 'Wrong password'}); 
				  } else {
                  request.session.user = doc[0].nickname;
                  response.redirect('/');
				  }
                  }); 
         });

app.post('/logout', function(request, response){         
         request.session.destroy();
         response.redirect('/');
         });

app.post('/save', function(request, response){
         var data = request.body;
         
         var userid = '2';
         var time = String (new Date().getTime()); 
         var messagesArray = new Array(time);
         
         data.time = time;
         mdb.messages.save(data);
		 response.redirect('/');
         });

nodemailer.SMTP = {
host: 'smtp.mailgun.org',
port: 465,
ssl: true,
use_authentication: true,
user: 'postmaster@paramaggarwal.mailgun.org',
pass: config.smtp_pass
}

app.get('/email', function(request, response) {
        nodemailer
		.send_mail({
				   sender: 'ourapp@ourapp.com',
				   to:'paramaggarwal@gmail.com',
				   subject:'Hello!',
				   html: '<p><b>Hi,</b> how are you doing?</p>',
				   body:'Hi, how are you doing?'
				   },function(error, success){
				   console.log('Message ' + success ? 'sent' : 'failed');
				   }
				   );
        response.end();
        });

var port = process.env.PORT || 3000;
app.listen(port, function() {
           console.log("Listening on " + port);
           });
