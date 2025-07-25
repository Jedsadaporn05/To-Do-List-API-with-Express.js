// เรียกใช้ library express ด้วยคำสั่ง require
import express, { Request, Response } from "express";
// ประกาศเริ่มต้นการใช้ express
const app = express();
// กำหนด port ที่ 8000

const port = 8000;
// เรียกใช้ bodyParser ด้วยคำสั่ง require
import bodyParser from "body-parser";

// ให้ express ใช้ bodyParser
app.use(bodyParser.json());

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

const validateUpdate = (newTask: any) => {
  let error = [];

  if (newTask.isCompleted && typeof newTask.isCompleted !== "boolean") {
    error.push("isCompleted must be a boolean");
  }
  return error;
}

// กำหนด model data
interface Task {
  id: Number;
  title: String;
  isCompleted: Boolean;
}

// สร้างตัวแปร users ขึ้นมาเป็น Array จำลองการเก็บข้อมูลใน Server (ซึ่งของจริงจะเป็น database)
let tasks: Task[] = [];

// GET ดึงข้อมูลออกมาทั้งหมด
app.get("/tasks", (req: Request, res: Response) => {
  res.json(tasks);
});

// GET ดึงข้อมูลออกมารายตัว GET by ID
app.get("/tasks/:id", (req: Request, res: Response) => {
  try {
    let id = Number(req.params.id);
    const task = tasks.find((task) => task.id == id);

    if (!task) {
      throw { statusCode: 404, message: "User not found" };
    }

    res.json(task);
  } catch (error: any) {
    let statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      message: error.message,
    });
  }
});

// POST สร้าง Task ใหม่ขึ้นมา
app.post("/tasks", (req: Request, res: Response) => {
  try {
    const data = req.body;

    const errors = validateData(data);
    if (errors.length > 0) {
      throw {
        message: "กรอกข้อมูลไม่ถูกต้อง",
        errors: errors,
      };
    }

    const newTask = {
      id: tasks.length + 1,
      title: data.title,
      isCompleted: data.isCompleted || false,
    };

    // push newUser เข้าไปใน array ของ users
    tasks.push(newTask);

    // Server ตอบกลับมาว่าเพิ่มเรียบร้อยแล้ว
    res
      .status(201)
      .json({ message: "User created successfully", user: newTask });
  } catch (error: any) {
    console.error("error message", error);
    res.status(501).json({
      message: error.message,
      errors: error.errors,
    });
  }
});

// PUT แก้ไขข้อมูล Task
app.put("/tasks/:id", (req: Request, res: Response) => {
  try {
    let id = Number(req.params.id);
    let updateUser = req.body;
    const task = tasks.find((task) => task.id == id);

    const errors = validateUpdate(updateUser);
    if (errors.length > 0) {
      throw {
        message: "กรอกข้อมูลไม่ถูกต้อง",
        errors: errors,
      };
    }

    if (!task) {
      throw { statusCode: 404, message: "User not found" };
    }

    if (updateUser.id) {
      throw {
        statusCode: 400,
        message: "Cannot update user id",
      };
    }

    if (updateUser.title) {
      task.title = updateUser.title;
    }

    if (updateUser.isCompleted) {
      task.isCompleted = updateUser.isCompleted;
    }

    res.json(task);
  } catch (error: any) {
    let statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      message: error.message,
      errors: error.errors,
    });
  }
});

// DEL ลบข้อมูล Task ด้วย ID
app.delete("/tasks/:id", (req: Request, res: Response) => {
  try {
    let id = Number(req.params.id);
    const task = tasks.find((task) => task.id == id);

    if (!task) {
      throw { statusCode: 404, message: "User not found" };
    } else {
      tasks = tasks.filter((task) => task.id != id);
    }

    res.status(204).json({
      message: "Delete Ok",
    });
  } catch (error: any) {
    let statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      message: error.message,
    });
  }
});

// ประกาศเปิด http server ที่ port 8000
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
