// กำหนด port ที่ 8000
const port = 8000;
// เรียกใช้ library express ด้วยคำสั่ง require หรือหากเป็น TypeScript ให้ใช้การ import
import express, { Request, Response } from "express";
// ประกาศเริ่มต้นการใช้ express
const app = express();
// เรียกใช้ library mysql2
import mysql from "mysql2/promise";
// เรียกใช้ library cors (Corss-Origin Resource Sharing)
import cors from "cors";
// เรียกใช้ bodyParser ด้วยคำสั่ง require หรือหากเป็น TypeScript ให้ใช้การ import
import bodyParser from "body-parser";

// ให้ express ใช้ bodyParser
app.use(bodyParser.json());
// ให้ express ใช้ cors
app.use(cors());

// สร้างตัวแปรสำหรับเชื่อต่อ MySQL
let conn: any = null;
// ฟังก์ชันเชื่อมต่อ MySQL
const initMySQL = async () => {
  conn = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "tutorials",
    port: 8889, // ปกติจะเป็น 3306 แต่เราใช้ 8889
  });
};

// สร้างฟังก์ชัน Validate ข้อมูล
const validateData = (newTask: any) => {
  let errors = [];

  if (!newTask.title) {
    errors.push("Title is required");
  }

  if (newTask.isCompleted && typeof newTask.isCompleted !== "boolean") {
    errors.push("isCompleted must be a boolean");
  }
  return errors;
};
// สร้างฟังก์ชัน Validate สำหรับการ PUT หรืออัพเดทข้อมูลเข้ามาใหม่
const validateUpdate = (newTask: any) => {
  let error = [];

  if (newTask.isCompleted && typeof newTask.isCompleted !== "boolean") {
    error.push("isCompleted must be a boolean");
  }
  return error;
};

// GET ดึงข้อมูลออกมาทั้งหมด
app.get("/tasks", async (req: Request, res: Response) => {
  const results = await conn.query("SELECT * FROM tasks");
  // Server response ตอบกลับด้วยข้อมูลใน results ที่ดึงข้อมูลมาจาก MySQL เป็นแบบ json
  res.json(results[0]);
});

// GET ดึงข้อมูลออกมารายตัว GET by ID
app.get("/tasks/:id", async (req: Request, res: Response) => {
  try {
    let id = Number(req.params.id);
    const results = await conn.query("SELECT * FROM tasks WHERE id = ?", id);

    if (!results[0] || results[0].length == 0) {
      throw { statusCode: 404, message: "User not found" };
    }
    // Server response ตอบกลับมาด้วยข้อมูลใน results ที่เป็นการดึงข้อมูลมาจาก id ใน MySQL เป็นแบบ json
    res.json(results[0][0]);
  } catch (error: any) {
    let statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      message: error.message,
    });
  }
});

// POST สร้าง Task ใหม่ขึ้นมา
app.post("/tasks", async (req: Request, res: Response) => {
  try {
    const data = req.body;
    // Validate ข้อมูลก่อนเพิ่มเข้า
    const errors = validateData(data);
    if (errors.length > 0) {
      throw {
        message: "กรอกข้อมูลไม่ถูกต้อง",
        errors: errors,
      };
    }
    const results = await conn.query("INSERT INTO tasks SET ?", data);
    // Server response ตอบกลับมาว่าเพิ่มเรียบร้อยแล้ว ด้วย statusCode 201
    res.status(201).json({
      message: "User created successfully",
      id: results[0].insertId,
      data: data,
    });
  } catch (error: any) {
    console.error("error message", error);
    res.status(501).json({
      message: error.message,
      errors: error.errors,
    });
  }
});

// PUT แก้ไขข้อมูล Task
app.put("/tasks/:id", async (req: Request, res: Response) => {
  try {
    let id = Number(req.params.id);
    let updateUser = req.body;
    const results = await conn.query("UPDATE tasks SET ? WHERE id = ?", [
      updateUser,
      id,
    ]);

    // Validate ข้อมูลต้องกรอกให้ถูกต้อง
    const errors = validateUpdate(updateUser);
    if (errors.length > 0) {
      throw {
        message: "กรอกข้อมูลไม่ถูกต้อง",
        errors: errors,
      };
    }
    // ไม่ให้อัพเดท user id ที่ไม่มีอยู่จริง
    if (results[0].affectedRows == 0) {
      throw { statusCode: 404, message: "User not found" };
    }
    // ไม่ให้อัพเดท id
    if (updateUser.id) {
      throw {
        statusCode: 400,
        message: "Cannot update user id",
      };
    }
    // Server response ตอบกลับมาว่าอัพเดทเรียบร้อยแล้วแบบ json
    res.json({
      message: "User Updated!",
      updateUser: updateUser,
    });
  } catch (error: any) {
    let statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      message: error.message,
      errors: error.errors,
    });
  }
});

// DEL ลบข้อมูล Task ด้วย ID
app.delete("/tasks/:id", async (req: Request, res: Response) => {
  try {
    let id = Number(req.params.id);
    const results = await conn.query("DELETE from tasks WHERE id = ?", id);

    if (results[0].affectedRows == 0) {
      throw { statusCode: 404, message: "User not found" };
    }

    // Server response ตอบกลับมาว่าลบเรียบร้อยแล้วแบบ json
    res.json({
      message: "User deleted successfully",
    });
  } catch (error: any) {
    let statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      message: error.message,
    });
  }
});

// ประกาศเปิด http server ที่ port 8000
app.listen(port, async () => {
  await initMySQL();
  console.log(`Server is running on port ${port}`);
});
