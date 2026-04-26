import Course from "../models/Course.js";
import { parseCSV } from "../utils/csvParser.js";
import redis from "../config/redis.js";

// Upload courses from CSV (Admin only)
export const uploadCourses = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const rawData = await parseCSV(req.file.path);
    
    // Map the complex CSV headers to our simple MongoDB schema
    const data = rawData.map(row => ({
      course_id: row['Unique ID'] || '',
      title: row['Course Name'] || '',
      description: row['Overview/Description'] || '',
      category: row['Discipline/Major'] || '',
      instructor: row['Professor Name'] || '',
      duration: row['Duration (Months)'] ? `${row['Duration (Months)']} months` : ''
    }));

    await Course.insertMany(data);
    res.json({ message: "Courses Uploaded", count: data.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all courses (public, with Redis cache)
export const getAllCourses = async (req, res) => {
  try {
    const cacheKey = "all_courses";
    const cached = await redis.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const courses = await Course.find({});
    await redis.setEx(cacheKey, 3600, JSON.stringify(courses));
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Search courses by title (public, with Redis cache)
export const searchCourses = async (req, res) => {
  const { q } = req.query;

  // If no query, return all courses
  if (!q || q.trim() === "") {
    return getAllCourses(req, res);
  }

  try {
    const cacheKey = `search:${q}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const courses = await Course.find({
      $or: [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } },
        { instructor: { $regex: q, $options: "i" } }
      ]
    });

    await redis.setEx(cacheKey, 3600, JSON.stringify(courses));

    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};