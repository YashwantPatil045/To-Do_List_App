const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');
require('dotenv').config()

let username = process.env.DB_USERNAME
let password = process.env.DB_PASSWORD

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

let today= new Date();

let options = {
  weekday: "long",
  day: "numeric",
  month: "long",
};

let day = today.toLocaleDateString("hi-IN", options);

mongoose.connect(`mongodb+srv://${username}:${password}@cluster0.l0iqq.mongodb.net/todolistDB`, {useNewUrlParser: true});

const itemsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  }
});

const Item = mongoose.model("Item", itemsSchema);

const itemOne = new Item({
  name: "Do something!!"
})

const itemTwo = new Item({
  name: "Hit that '+' to add in list"
})

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
})

const List = mongoose.model("List", listSchema)

const newItem = [itemOne, itemTwo]

app.get("/", function(req, res){

     Item.find(function(err, items){
      if (items.length === 0) {
        Item.insertMany(newItem, function(err){
          if (err) {
            console.log(err);
          } else {
            console.log("Successfully inserted");
          }
        });
        res.redirect("/");
       } else {
           res.render("list", {day: day, docs: items, title: "Today"});
       }
     });
  });

app.post("/", function(req, res, nex){
  const itemName = req.body.newItem;
  const listName = req.body.listName;
  const item = new Item({name: itemName});

  const err = item.validateSync();

  if (err instanceof mongoose.Error.ValidationError) {
    console.log("Item name" + err.errors['name'].kind);
    res.redirect("/");
    nex();
  } else {
      if (listName === "Today"){
        item.save();
        res.redirect("/");
      } else {
          List.findOne({name: listName}, function(err, foundList){
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
          });
        }
      }
  });



app.post("/delete", function(req, res){
  var itemId = req.body.checkbox;
  var listName = req.body.listName;
  if (listName === "Today"){
    Item.findByIdAndRemove(itemId, function(err){
      if (!err) {
        res.redirect("/");
        console.log("Successfully deleted");
      }
    });
  }
   else {
      List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: itemId}}}, function(err, docs){
        if (!err){
          res.redirect("/" + listName);
        }
      })
    }
  });


app.get("/:paraName", function(req, res){
  let customName = _.capitalize(req.params.paraName);

  List.findOne({ name: customName}, function (err, docs) {
    if (!err) {
      if (!docs){
        const list = new List({
          name: customName,
          items: newItem,
        });
        list.save();
        res.redirect("/" + customName);
      } else {
      res.render("list.ejs", {title: docs.name, docs: docs.items, day:day});
      }
    }
  });
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function(){
  console.log("Server has started successfully");
});
