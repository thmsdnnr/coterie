const express=require('express');
const bodyParser=require('body-parser');
const path=require('path');
const fetch = require('node-fetch');
const moment = require('moment');
const sha1=require('sha1');
const fs = require('fs');
const Db=require('./bookDb.js');
const db=Db.mongooseDatabase;
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const mongoose=require('mongoose');
const cookieParser = require('cookie-parser');
const helmet=require('helmet');

const app=express();
app.use(helmet());
app.use(cookieParser(process.env.SESSION_SECRET || 'DREAMSBEDREAMS'));
app.use(session({
  store: new MongoStore({
    mongoose_connection: db,
    url: process.env.PROD_DB || 'mongodb://localhost:27017/coterie',
    ttl: 14 * 24 * 60 * 60 // = 14 days. Default
  }), //https://github.com/jdesboeufs/connect-mongo
  secret: process.env.SESSION_SECRET || 'DREAMSBEDREAMS',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge:(60*60*1000) } //1 hour max age -> DOESN'T WORK WITH SECURE:TRUE ON NON-HTTPS LOCALHOST
}));
app.use(express.static(path.join(__dirname+'/static')));
app.use(['/login','/register','/s','/addToShelf','/updateProfile','/proposeTrade',
'/completeTradeRequest','/trades','/addBook'],bodyParser.urlencoded({extended:true}));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname+'/views'));

function bookSearch(query,params) {
  let qP = {"title":"intitle:","author":"inauthor:","subject":"subject:","ISBN":"isbn:"};
  return new Promise(function (resolve,reject) {
        fetch(`https://www.googleapis.com/books/v1/volumes?q=${qP[params.qP]}"${query}"&key=${process.env.API_KEY}&maxResults=10&startIndex=${params.startIndex}&printType=books`)
      .then(function(books) { resolve(books.json()); })
      .catch(function(err) { reject(err); }); //returns a promise
    });
  }

function singleBook(gid) {
  return new Promise(function (resolve, reject) {
    fetch(`https://www.googleapis.com/books/v1/volumes/${gid}?key=${process.env.API_KEY}`)
    .then(function(book) { resolve(book.json()); })
    .catch(function(err) { reject(err); });
  });
}

function fetchBookFromDb(gid) {
  return new Promise(function (resolve, reject) {
    Db.findBook({gid:gid}, function(err,data) {
      if (err) {reject(err);}
      resolve(data[0]);
    });
  });
}

app.post('/addBook', function(req,res) {
  Db.saveCustomBook({title:req.body.title,description:req.body.description,author:req.body.author}, function(err, data){
    if(!err) {
      Db.addUserBook({username:req.session.user, bookID:data._id}, function(err, data){
      });
    }
  });
});

app.get('/addBook', auth, function(req,res) { //add a custom book
  let payload={user:req.session.user};
  res.render('customBook', {data:payload});
});

app.post('/s', function(req,res) {
  let r=req.body;
  let startAt;
  let skip=10; //number of results per page
  (r.startIndex) ? startAt=r.startIndex*skip : startAt=0;
  let bookList=bookSearch(r.qText,{qP:r.qParam,startIndex:startAt});
    bookList.then(function(books) {
      let payload={books:books.items,user:req.session.user,query:{qText:r.qText,qParam:r.qParam,startIndex:(startAt/skip)},totalItems:books.totalItems};
      if(startAt===0) { //page not rendered yet, so render
          if (books.totalItems>0) { res.render('list', {data:payload}); }
          else { res.send('no results for this query!'); }
        }
      else { //page already exists just send the new data
        if (books.totalItems>startAt) {
          res.type=('application/json');
          res.send(payload);
        }
      }
    });
  });

app.post('/addToShelf', auth, function(req,res) {
    Db.findBook({gid:req.body.gid}, function(err,data) {
      if (!err) {
        if (!data[0]) { //if we don't already have the book in our collection
          let bData=singleBook(req.body.gid); //fetch from Google API
          bData.then(function(book) {
            Db.saveBook(book, function(err, data) { //add it to DB
              if(!err) {console.log(data);}
              else { console.log(err); }
            });
          });
        }
      }
    });
    Db.addUserBook({username:req.session.user, bookID:req.body.gid}, function(err, data){ //add GID to user list
      if (!err) { console.log('successfully saved'); }
      });
    });

function listUserBooks(username) {
  return new Promise(function(resolve, reject) {
    Db.findUser({username:username}, function(err, data) {
    if (!data[0]) {
      reject('No results available');
    }
    else {
      let bookPromises=[];
      data[0].booksOwned.forEach((book)=>{ bookPromises.push(fetchBookFromDb(book)); });
      Promise.all(bookPromises).then(function(books){resolve(books);});
      }
    });
  });
}

app.post('/proposeTrade', function(req,res) {
  let requestingUser=listUserBooks(req.session.user);
  requestingUser.then(function(books){
    books=books.filter((book)=>book!==undefined).filter((book)=>book.gid!==req.body.userRequestedFromBookID);
    let payload={books:books,user:req.session.user,pageUser:req.session.user,tradeUser:req.body.userRequestedFrom,tradeFor:req.body.userRequestedFromBookID,tradeForName:req.body.tradeForName};
    res.send(JSON.stringify(payload));
  }).catch((err)=>console.log(err));
});

app.post('/completeTradeRequest', function(req,res) {
  let inExchangeFor=req.body.userRequestedFromBookID;
  let tradeFor=req.body.userRequestingBookID;
  let requestingU=req.body.userRequesting;
  let requestedU=req.body.userRequestedFrom;
  Db.saveTrade({requestingU: requestingU, requestedU: requestedU, tradeFor: tradeFor,
    inExchangeFor: inExchangeFor, status: 'PEND'},
    function(err,data) {
    if (!err) {
      res.redirect('/trades');
    }
  });
});

function findUserTrades(u) { //we filter out canceled trades on the backend
  return new Promise(function(resolve,reject) {
    Db.findUserInitiatedTrades({username:u},function(err,data) {
      if(err) { reject(err); }
      resolve(data);
    });
  });
}

function findSuggestedTrades(u) {
  return new Promise(function(resolve, reject) {
    Db.findUserSuggestedTrades({username:u},function(err,data) {
      if(err) { reject(err); }
      resolve(data);
      });
    });
  }

app.get('/trades', auth, function(req, res) {
  let uT=findUserTrades(req.session.user);
  let sT=findSuggestedTrades(req.session.user);
  Promise.all([uT,sT]).then(function(d){
    //it is possible there will be the same book multiple times on the page
    //before I fetch book data on each ID, I want to make sure I'm only doing it once per book
    //if the book appears multiple times on the page, I can look up the same data by ID in my
    //bookInfoDictionary like: bookInfoDictionary[gid].
    let bookIDList=[];
    let uniqIDList=[];
    let promiseArr=[];
    d[0].forEach((book)=>{
      bookIDList.push(book.inExchangeFor)
      bookIDList.push(book.tradeFor)
    });
    d[1].forEach((book)=>{
      bookIDList.push(book.inExchangeFor)
      bookIDList.push(book.tradeFor)
    });//TODO maybe can do this on bookIDList itself with a .filter()
    bookIDList.forEach((id)=>{ (uniqIDList.indexOf(id)===-1) ? uniqIDList.push(id) : null; });
    uniqIDList.forEach(book=>promiseArr.push(fetchBookFromDb(book)));
    Promise.all(promiseArr).then(function(data) {
      let bookInfoDictionary={};
      data.forEach((d)=>bookInfoDictionary[d.gid]=d);
      let payload={userTrades:d[0],suggestedTrades:d[1],user:req.session.user,bookInfo:bookInfoDictionary};
      res.render('listTrades',{data:payload});
    });
  });
});

//receives an OBJECT ID for trades and one of
//ACTIONS: ACCEPT, REJECT, CANCEL
//VALIDATION:
//if ACCEPT or REJECT, req.session.user must eq requestedU
//if CANCEL, req.sesssion.user must eq requestingU
app.post('/trades', function(req,res) { //TODO cleanup with promises or something PLZ
  Db.findTradeByID({id:req.body.id},function(err,data){
    if(!err) {
      if (req.body.action==='ACCEPT'||req.body.action==='REJECT') {
        if(req.session.user===data.requestedU) { //valid, execute action on ID
          if(req.body.action==='ACCEPT') {
            let userA=data.requestingU;
            let bookA=data.inExchangeFor; //A loses Book A & gains Book B
            let userB=data.requestedU; //B loses Book B & gains Book A
            let bookB=data.tradeFor;
            console.log(`{bookA:${bookA},bookB:${bookB},userA:${userA},userB:${userB}`);
            Db.tradeTwoBooks({bookA:bookA,bookB:bookB,userA:userA,userB:userB}, function(err, data) {
                if (!err) {
                  Db.updateTradeStatus({id:req.body.id,status:'COMPLETE'},function(err,data){
                    if(!err) {
                      res.redirect('/trades');
                    }
                  });
                }
              });
            }
            else { //reject trade
              Db.updateTradeStatus({id:req.body.id,status:'REJECTED'},function(err,data){
                if(!err) {
                  res.redirect('/trades'); //TODO this redirect doesn't work?!  //have to click REFRESH to see the update
                }
              });
            }
          }
          else { //invalid request
            res.send('That was sneaky but no you cannot do that');
          }
        }
      else {
        if (req.session.user===data.requestingU) {
          console.log('canceltrade');
          //Db update status then redirect to trades
          Db.updateTradeStatus({id:req.body.id,status:'CANCEL'},function(err,data){
            if(!err) {
              console.log(data);
              res.redirect('/trades');
            }
            console.log(err);
          });
        }
        else { //user not authorized to make this choice
          //TODO customize message page
          res.send('That was sneaky but no you cannot do that');
        }
      }
    }
    console.log(err);
  });
});

app.get('/u/:username', auth, function(req,res) {
  let userBooks=listUserBooks(req.params.username);
  userBooks.then(function(books) {
    books=books.filter((book)=>book!==undefined);
    let payload={books:books,user:req.session.user,pageUser:req.params.username};
    res.render('list',{data:payload});
  }).catch((err)=>console.log(err));
});

app.get('/everyone', function(req,res) {
  Db.findAllUsers(function(err,users) {
    if(!err) {
      let payload={users:users,user:req.session.user};
      res.render('userList',{data:payload});
    }
  });
})

app.get('/search', auth, function(req,res) {
    res.render('searchBooks', {data:{user:req.session.user}});
  });

app.get('/updateProfile', auth, function(req,res) {
  Db.findUser({username:req.session.user}, function(err, data) {
      if (!err) {
        let payload={data:data[0],user:req.session.user};
        res.render('updateProfile',{data:payload});
      }
    });
  });

app.post('/updateProfile', function(req, res) {
  Db.updateUserProfile({username:req.session.user,fullName:req.body.fullName,city:req.body.city,state:req.body.state}, function(err,data){
    if(!err) { res.redirect('/updateProfile'); }
    else { res.redirect('/login'); }
  });
});

app.get('/logout', function(req,res){
  console.log(`logging out req.user:${req.session.user}`);
  req.session.destroy();
  let payload={header:'Goodbye.', message:`Thank you for stopping by. Come again soon!`};
  res.render('message',{data:payload});
});
app.get('/login', function(req,res) { res.render('login',{data:{warning:false,user:req.session.user}}); });
app.get('/register', function(req,res) { res.render('register', {data:{warning:false,user:req.session.user}}); });

app.post('/login', function(req,res) {
    let inputUser=req.body.username;
    let inputPwd=req.body.password;
    if (inputUser===''||inputPwd==='') { res.render('login',{data:{warning:true,user:req.session.user}}); return false;}
    else {
      Db.findUser({'username':inputUser},function(err,data){
        if(data[0]) {
          if ((data[0].username===inputUser)&&(data[0].password===sha1(inputPwd))) //it's a match
          {
            req.session.user=inputUser;
            res.redirect('/search');
          }
          else {
            req.session.user='';
            res.render('login',{data:{warning:true,user:req.session.user}});
          }
        }
        else
          {
            req.session.user='';
            res.render('login',{data:{warning:true,user:req.session.user}});
          }
        });
      }
    });

app.post('/register', function(req,res) {
  let inputUser=req.body.username;
  let inputPwd=req.body.password;
  Db.findUser({username:inputUser},function(err, data){
    if (!data[0]) {
      if (inputPwd!=="") {
        Db.saveUser({'username':inputUser,'password':sha1(inputPwd),fullName:req.body.fullName,city:req.body.city,state:req.body.state},function(err, d){
          req.session.user=inputUser;
          console.log(req.session.user+"sessionuser");
          let payload={header:'Welcome to Coterie!', message:`Welcome, ${inputUser}.`,link:'/login'};
          res.render('message',{data:payload});
      });
      }
      else {
        let payload={header:'There is no try.', message:`Password cannot be blank.`, link:null};
        res.render('message',{data:payload});
      }
    }
    else {
      let payload={header:'There is no try.', message:`${inputUser} is taken.`, link:null};
      res.render('message',{data:payload});
    }
  });
});

app.get('/', function(req,res) {
  if(req.session.user) {
    res.redirect(`/u/${req.session.user}`);
  }
  else {
    res.redirect('/login');
  }
});

app.get('*', function(req,res) {
  res.send('catch-all');
});

app.listen(process.env.PORT||3000);

function auth(req, res, next) {
  if (req.session.user!==undefined) {
    return next();
  }
  res.redirect('/login');
}
