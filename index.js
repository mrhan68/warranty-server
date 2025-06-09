const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const sharp = require("sharp");
const path = require("path");
const app = express();
const upload = multer({ dest: "uploads/" }); // Lưu file upload vào thư mục uploads

app.use(cors());
app.use(express.json());

// Cho phép truy cập file tĩnh trong thư mục uploads
app.use('/uploads', express.static('uploads'));

// Nhận dữ liệu dạng form-data (có file)
app.post("/api/warranty-register", upload.any(), async (req, res) => {
  // Thông tin text
  const fields = req.body;
  // File upload
  const files = req.files;
  
  console.log("Received warranty registration:");
  console.log("Fields:", fields);
  console.log("Files:", files);
  fs.appendFileSync(
    "warranty-registers.json",
  JSON.stringify({
      fields,
      files: files.map(f => ({
        fieldname: f.fieldname,
        originalname: f.originalname,
        filename: f.filename, // tên file trên server
        path: f.path,         // đường dẫn file trên server
        mimetype: f.mimetype,
        size: f.size
      })),
      createdAt: new Date()
    }) + "\n"
  );
  // TODO: Lưu vào database hoặc gửi tiếp đi nơi khác
  for (const file of files) {
    // Chuyển sang JPG, lưu cùng tên nhưng đuôi .jpg
    const outputPath = file.path + ".jpg";
    await sharp(file.path)
      .jpeg()
      .toFile(outputPath);
    // Bạn có thể xóa file gốc nếu muốn:
    // fs.unlinkSync(file.path);
  }
  for (const file of files) {
    const ext = path.extname(file.originalname);
    const newPath = file.path + ext;
    fs.renameSync(file.path, newPath);
    file.path = newPath;
    file.filename = path.basename(newPath);
  }

  res.json({ success: true, message: "Đã nhận bản tin bảo hành!" });
});

// Thêm vào index.js trên server
app.get("/api/warranty-list", (req, res) => {
  const fs = require("fs");
  try {
    const data = fs.readFileSync("warranty-registers.json", "utf8");
    // Mỗi bản ghi là 1 dòng, chuyển thành mảng object
    const lines = data.trim().split("\n").map(line => JSON.parse(line));
    res.json(lines);
  } catch (err) {
    res.status(500).json({ error: "Không đọc được file!" });
  }
});

// Start server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});