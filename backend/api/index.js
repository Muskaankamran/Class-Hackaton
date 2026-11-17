
import app from "../src/app.js";
import connectDB from "../src/db/db.js";

export default async function handler(req, res) {
    try {
        await connectDB();
        return app(req, res);
    } catch (error) {
        console.error("Backend error:", error);
        return res.status(500).json({
            message: "Database connection failed",
        });
    }
}
