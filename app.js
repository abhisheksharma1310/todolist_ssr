
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const date = require(__dirname + "/date.js");
require('dotenv').config();

//Initiallize express as app
const app = express();

//set ejs as view engine
app.set('view engine', 'ejs');

//use body parser
app.use(bodyParser.urlencoded({ extended: true }));
//use static folder public
app.use(express.static("public"));

//connect to mongodb databse server and create todolistDB
const localUrl = "mongodb://localhost:27017/todolistDB";
const dbUrl = process.env.DBURL;
mongoose.connect(dbUrl);

//create schema for item
const itemsSchema = {
  name: String
};

//create mongoose model for itemsSchema
const Item = mongoose.model("Item", itemsSchema);

//create document for items collection
const item1 = new Item({
  name: "Welcome to your todolist!"
});
const item2 = new Item({
  name: "Hit the + button to add a new item."
});
const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

//default items
const defaultItems = [item1, item2, item3];

//create schema for custom list
const listSchema = {
  name: String,
  items: [itemsSchema]
};

//create modal for listSchema
const List = mongoose.model("List", listSchema);

//serve page when receive get request from client
app.get("/", function (req, res) {
  //const day = date.getDate();
  //Read documents from collection
  Item.find({}, function (err, foundItems) {
    if (err) {
      console.log(err)
    } else {
      if (foundItems.length === 0) {
        //Insert document in collection items
        Item.insertMany(defaultItems, function (err) {
          err ? console.log(err) : console.log("Defaults items inserted successfully!");
        });
        res.redirect("/");
      } else {
        res.render("list", { listTitle: "Today", newListItems: foundItems });
      }
    }
  });
});

//serve page when receive post request from client to add new item
app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });
  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

//serve page when receive post request from client to delete the item
app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId, function (err) {
      err ? console.log(err) :
        res.redirect("/");
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if(!err){
        res.redirect("/" + listName);
      }
    });
  }
});

//serve page when receive request to create new category of todolist
app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);
  //find lists collection have or not customList name document
  List.findOne({ name: customListName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        //crate documents for lists collection
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        //show an existing list
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
      }
    }
  });
});

app.get("/about", function (req, res) {
  res.render("about");
});

let port = process.env.PORT;
if(port == null || port == ""){
  port = 3000;
}

app.listen(port, function () {
  console.log("Server started on port ", port);
});
