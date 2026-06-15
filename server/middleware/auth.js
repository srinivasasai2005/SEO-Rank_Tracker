import jwt from "jsonwebtoken";

const auth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if(!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ success : false, message : "Unauthorized." });

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.userId = decoded.id;
        next();

    } catch (error) {
        console.error("Auth Middleware error : ", error.message);
        res.status(401).json({ success : false, message : "Internal server error." });
    }
}

export default auth;