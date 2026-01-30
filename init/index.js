const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

main()
.then((res)=>{
    console.log("Connected successfully !");
})
.catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/WanderWay');
};

const initDB = async() =>{
    await Listing.deleteMany({});
    initData.data = initData.data.map((obj) =>({...obj , owner : "69737268a2ad90cd02fb5357"})); 
    await Listing.insertMany(initData.data);
    console.log("data was initalized");
}

initDB();
