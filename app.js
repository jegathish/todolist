//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-jegathish:jegathish@cluster0-rwv3p.mongodb.net/todolistDB",{useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });

//items schema and its model
const itemsSchema = {
  name: String
}
const Item = mongoose.model("item",itemsSchema);

const item1 = new Item({
  name: "Welcome to Todolist!"
});
const item2 = new Item({
  name: "Hit the + button to add a new item."
});
const item3 = new Item({
  name: "<= Hit this to delete an item."
});

const defaultItems =[item1, item2, item3];

// create a new list for custom tasks
const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

// home route and to add default items
app.get("/", function(req, res) {
  Item.find({}, function(err,foundItems){
    if(err) {
      console.log(err);
    } else {
      if (foundItems.length==0) {
        Item.insertMany(defaultItems, function(err){
          if(err) {
            console.log(err);
          } else {
              console.log("defaultItems Added successfully.");
              res.redirect("/");
            }
        });
      } else {
        res.render("list", {listTitle: "Today", newListItems: foundItems});
      }
    }
  });
});

// Add new items
app.post("/", function(req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });
  if (listName === "Today"){
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

// delete the marked Item
app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if(listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if(err) {
        console.log(err);
      } else {
        console.log("checkedItem removed successfully");
      }
    });
    res.redirect("/");
  } else {
    List.findOneAndUpdate({name: listName},{$pull: {items: {_id: checkedItemId}}},function(err, foundList){
      if(!err) {
        res.redirect("/" + listName);
      }
      }
    );
  }
 });

// (express) route for different tasks
app.get("/:customListName", function(req, res) {

  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name: customListName}, function(err, foundList){
    if(!err) {
      // create new list
      if (!foundList) {
        const list = new List({
        name: customListName,
        items: defaultItems
        });
        list.save();
        res.redirect("/"+customListName);
      } else {
        // show existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });
});

//about
app.get("/about", function(req, res) {
  res.render("about");
});

//localhost
app.listen(3000, function() {
  console.log("server started listening at 3000:");
});
