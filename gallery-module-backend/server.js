const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const sharp = require("sharp");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const Config = require("./models/Config");
const Image = require("./models/Image");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/uploads",express.static("uploads"));

/* ================= MONGODB ================= */

mongoose.connect("mongodb://127.0.0.1:27017/galleryDB")
.then(()=>console.log("MongoDB Connected"));

/* ================= CREATE UPLOAD FOLDER ================= */

if(!fs.existsSync("uploads")){
  fs.mkdirSync("uploads");
}

/* ================= MULTER ================= */

const storage = multer.memoryStorage();
const upload = multer({storage});

/* ================= SAVE CONFIGURATION ================= */

app.post("/configurations", async(req,res)=>{

  let config = await Config.findOne();

  if(config){

    config.sizes = req.body.sizes;

    await config.save();

    return res.json(config);

  }

  const newConfig = new Config(req.body);

  await newConfig.save();

  res.json(newConfig);

});

/* ================= GET CONFIG ================= */

app.get("/configurations", async(req,res)=>{

  const config = await Config.findOne();

  res.json(config);

});

/* ================= UPLOAD IMAGE ================= */

app.post("/images/upload", upload.single("image"), async(req,res)=>{

  try{

    const config = await Config.findOne();

    if(!config){
      return res.status(400).json({
        message:"No resize configuration found"
      });
    }

    const fileName = Date.now()+".jpg";

    const originalPath = `uploads/original_${fileName}`;

    await sharp(req.file.buffer)
      .toFile(originalPath);

    const resizedImages = {};

    for(const size of config.sizes){

      const resizedName = `${size.width}x${size.height}_${fileName}`;

      const resizedPath = `uploads/${resizedName}`;

      await sharp(req.file.buffer)
        .resize(size.width,size.height)
        .toFile(resizedPath);

      resizedImages[
        `${size.width}x${size.height}`
      ] = resizedPath;

    }

    const image = new Image({

      original: originalPath,

      sizes: resizedImages

    });

    await image.save();

    res.json({
      message:"Image uploaded successfully",
      image
    });

  }
  catch(err){

    res.status(500).json({error:err.message});

  }

});

/* ================= GET IMAGES ================= */

app.get("/images", async(req,res)=>{

  const images = await Image.find();

  res.json(images);

});

/* ================= DELETE IMAGE ================= */

app.delete("/images/:id", async(req,res)=>{

  const image = await Image.findById(req.params.id);

  if(!image){
    return res.status(404).json({
      message:"Image not found"
    });
  }

  if(fs.existsSync(image.original)){
    fs.unlinkSync(image.original);
  }

  await Image.findByIdAndDelete(req.params.id);

  res.json({
    message:"Deleted successfully"
  });

});

/* ================= SERVER ================= */

app.listen(5000,()=>{
  console.log("Server running on port 5000");
});