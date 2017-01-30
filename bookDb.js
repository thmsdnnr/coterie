var MongoClient = require('mongodb').MongoClient;
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectID=require('mongodb').ObjectID;
let db;
let dbUrl=process.env.PROD_DB||'mongodb://localhost:27017/coterie';

exports.mongooseDatabase=db;

function connect(callback) {
  if (db===undefined) {
    mongoose.connect(dbUrl);
    var database=mongoose.connection;
    database.on('error', function(error){
      console.error.bind(console, 'connection error:');
      callback(error);
    });
    database.once('open', function(){
      db=database;
      callback(null, db);
    });
  }
  else { callback(null, db); }
}

connect(function(status){console.log(status);});

//SCHEMAS
let tradeSchema = new Schema({
  requestingU: {type: String, required: true},
  requestedU: {type: String, required: true},
  tradeFor: {type: String, required: true},
  inExchangeFor: {type: String, required: true},
  status: { type: String, enum: ['PEND', 'COMPLETE', 'REJECTED', 'CANCEL'], required:true }
});

let bookSchema = new Schema({
  gid: {type: String, required: true},
  volumeInfo: Object,
  saleInfo: Object,
  accessInfo: Object
});

let userSchema = new Schema({
  username: {type: String, required: true},
  password: {type: String, required: true},
  fullName: String,
  city: String,
  state: String,
  booksOwned: Array, //[{type:Schema.Types.ObjectId, ref:'Book'}], //array of gids from bookSchema
  booksLoaned: [{type:Schema.Types.ObjectId, ref:'Book'}] //array of gids from bookSchema
});

//MODELS
let Trade = mongoose.model('Trade', tradeSchema);
let Book = mongoose.model('Book', bookSchema);
let User = mongoose.model('User', userSchema);

//TRADES

exports.saveTrade = function(data,cb) {
  let newTrade = new Trade({
    requestingU: data.requestingU,
    requestedU: data.requestedU,
    tradeFor: data.tradeFor,
    inExchangeFor: data.inExchangeFor,
    status: data.status
  });
  newTrade.save(function (err, data) {
    if (err) { cb(err, null); }
    else { cb(null, data); }
  });
}

exports.updateTradeStatus = function(data,cb) {
  Trade.update({'_id': data.id}, {status:data.status},
    function(err, data) {
      if (err) { cb(err, null); }
      else { cb(null, data); }
  });
}

//TODO batch these operations maybe with MongoDb BULK()
//TODO could add additional validation here to make sure two update operations done
//TODO or that booksOwned.length is the same for both users before/after
exports.tradeTwoBooks = function(data, cb) {
  let modified=0;
  //remove Book A from User A
  User.update({username:data.userA},{$pull:{booksOwned:data.bookA}}, function(err,data){
    modified+=data.nModified;
  });
  //add Book B to User A
  User.update({username:data.userA},{$push:{booksOwned:data.bookB}}, function(err,data){
    modified+=data.nModified;
  });

  //remove Book B from User B
  User.update({username:data.userB},{$pull:{booksOwned:data.bookB}}, function(err,data){
    modified+=data.nModified;
  });
  //add Book A to User B
  User.update({username:data.userB},{$push:{booksOwned:data.bookA}}, function(err, data){
    modified+=data.nModified;
  });
  cb(modified);
}

exports.findUserInitiatedTrades = function(data,cb) {
  Trade.find({requestingU:data.username})
  .where({status:{$nin:['CANCEL','REJECTED','COMPLETE']}}) //TODO just filter out server-side, could display
  .exec(function(err, data){
    if (err) { cb(err, null); }
    else { cb(null, data); }
  });
}

exports.findUserSuggestedTrades = function(data,cb) {
  Trade.find({requestedU:data.username})
  .where({status:{$nin:['CANCEL','REJECTED','COMPLETE']}}) //TODO just filter out server-side, could display
  .exec(function(err, data){
    if (err) { cb(err, null); }
    else { cb(null, data); }
  });
}

exports.findTradeByID = function(data,cb) {
  Trade.findOne({_id:ObjectID(data.id)}, function(err, data){
  if (err) { cb(err, null); }
  else { cb(null, data); }
});
}

//BOOKS

exports.saveBook = function(data,cb) {
  let newBook = new Book({
    gid: data.id,
    volumeInfo: data.volumeInfo,
    saleInfo: data.saleInfo,
    accessInfo: data.accessInfo
  });
  newBook.save(function (err, data) {
    if (err) { cb(err, null); }
    else { cb (null, data); }
  });
}

exports.saveCustomBook = function(data,cb) { //for a custom book we give GID === ID.
  let newBook = new Book({
      volumeInfo: {
      title: data.title,
      description: data.description,
      authors: [data.author]
    }
  });
  newBook.gid=newBook['_id'];
  newBook.save(function (err, data) {
    if (err) { cb(err, null); }
    else { cb (null, data); }
  });
}

exports.findBook = function(data,cb) {
  Book.find({gid:data.gid}, function(err, data){
    if (err) { cb(err, null); }
    else { cb(null, data); }
  });
}

exports.deleteBook = function(data,cb) {

}

//USERS

exports.saveUser = function(data, cb){
  let newYou = new User({
    username:data.username,
    password:data.password,
    fullName:data.fullName,
    city:data.city,
    state:data.state
  });
  newYou.save(function (err, data) {
    if (err) { cb(err, null); }
    else { cb(null, data); }
  });
}

exports.findAllUsers = function(cb) {
  User.find({}, function(err, data){
    if (err) { cb(err, null); }
    else { cb(null, data); }
  });
}

exports.findUser = function(data, cb) {
  User.find({username: data.username}, function(err, data){
    if (err) { cb(err, null); }
    else { cb(null, data); }
  });
}

exports.updateUserProfile = function(data, cb){
  User.update({username: data.username}, {fullName:data.fullName, city:data.city, state:data.state},
    function(err, data) {
      if (err) { cb(err, null); }
      else { cb(null, data); }
  });
}

exports.addUserBook = function(data, cb){
  User.update({ username: data.username },
    { $push: { booksOwned: data.bookID }}, function (err, data) {
      if (err) { cb(err, null); }
      else { cb(null, data); }
    });
  }
