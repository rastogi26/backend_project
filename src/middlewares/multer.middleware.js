import multer  from "multer";

// using disk storage because if we use memory storage and if lage videos uploaded it will make problems


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);   //recommand not to use originalname can have multiple name of dhruv which will lead to overwrite . we have use this as it will be kept in public for very small time and will upload to cloudinary
    // console.log(file);
  },
});

export const upload = multer({ storage, });