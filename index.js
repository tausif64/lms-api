import express from "express";
import dotenv from "dotenv";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./src/lib/auth.js";
import cors from 'cors';


// Import your new route modules
import publicCourseRoutes from "./src/routes/public/course.routes.js";
import studentEnrollmentRoutes from "./src/routes/student/enrollment.routes.js";
import instructorCourseRoutes from "./src/routes/instructor/course.routes.js";

// import { connectRabbitMQ } from "./src/shared/rabbitMq.js";

dotenv.config();

const app = express();
const PORT = 5000;

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}))


// Auth routes are handled by better-auth
app.use("/api/auth/", toNodeHandler(auth));



app.use(express.json());
app.use(express.urlencoded({ extended: true }));  

// Register your custom API routes with base paths
app.use("/api", publicCourseRoutes);
app.use("/api/student", studentEnrollmentRoutes);
app.use("/api/instructor", instructorCourseRoutes);
// app.use('/api/admin', adminRoutes); // You would add admin routes here

// Optional: Add a simple error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

app.use('/', (req,res)=> {
  res.send('hello from server')
});

app.use('/hello', (req,res)=> {
  res.send('hello from server 2')
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  // connectRabbitMQ();
});
