import bcrypt from "bcrypt";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { getConnection } from "../db/index.js"; // Assuming you have a function to get a MySQL connection

// Generate access and refresh tokens for a user
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const connection = await getConnection();
        
        // Query for the user
        const [users] = await connection.query("SELECT * FROM users WHERE id = ?", [userId]);

        // Check if user exists
        if (users.length === 0) {
            throw new ApiError(404, "User not found");
        }

        const user = users[0];

        // Generate the access token with a short expiration time (15 minutes)
        const accessToken = jwt.sign({ id: user.id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1d" });

        // Generate the refresh token with a longer expiration time (7 days)
        const refreshToken = jwt.sign({ id: user.id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

        // Store the refresh token in the database
        // await connection.query("UPDATE users SET refresh_token = ? WHERE id = ?", [refreshToken, user.id]);

        return { accessToken, refreshToken };
    } catch (error) {
        console.error("Error generating access and refresh tokens:", error.message); // Log the error
        throw new ApiError(500, "Error generating access and refresh tokens");
    }
};


// Register a new user
const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, username, password, department, phoneNumber } = req.body;

    if ([fullName, email, username, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    const connection = await getConnection();

    // Fetch existing user
    const [existingUser] = await connection.query(
        "SELECT * FROM users WHERE id = ? OR email = ?",
        [username, email]
    );

    console.log("Query result:", existingUser);

    if (existingUser.length > 0) {
        throw new ApiError(409, "User with email or username already exists");
    }

    const [existingDept] = await connection.query(
        "SELECT department_id FROM departments WHERE name = ?",
        [department]
    );

    if (existingDept.length === 0) {
        throw new ApiError(409, "Department not exist.");
    }

    // console.log(existingDept)

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    await connection.query(
        "INSERT INTO users (full_name, email, id, password, department_id, phone_number) VALUES (?, ?, ?, ?, ?, ?)",
        [fullName, email, username.toLowerCase(), hashedPassword, existingDept[0].department_id, phoneNumber]
    );

    res.status(200).json({statusCode: 200,message: "User registered successfully"});
});


// Login a user
const loginUser = asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        throw new ApiError(400, "Username and password are required");
    }

    const connection = await getConnection();

    // Fetch the user from the database
    const [rows] = await connection.query("SELECT * FROM users WHERE id = ?", [username]);

    // Check if the user exists
    if (rows.length === 0) {
        throw new ApiError(401, "Invalid user credentials");
    }

    // Extract the user object
    const user = rows[0];

    // Compare the provided password with the hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials");
    }

    // Generate tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user.id);

    // Prepare user response
    const loggedInUser = {
        id: user.id,
        email: user.email,
        fullName: user.full_name, // Make sure the field name matches your database column
        phoneNumber: user.phone_number, // Match column name
        department: user.department,
    };

    // Set cookies and send response
    res.cookie("accessToken", accessToken, { httpOnly: true, secure: true, sameSite: "None" });
    res.status(200).json(
        new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "User logged in successfully")
    );
});


// Logout a user
const logoutUser = asyncHandler(async (req, res) => {
    const connection = await getConnection();
    // await connection.query("UPDATE users SET refresh_token = NULL WHERE id = ?", [req.user.id]);

    res.clearCookie("accessToken", { httpOnly: true, secure: true, sameSite: "None" });
    res.clearCookie("refreshToken", { httpOnly: true, secure: true, sameSite: "None" });
    res.status(200).json(new ApiResponse(200, {}, "User logged out successfully"));
});

// Refresh access token
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) throw new ApiError(401, "Unauthorized request");

    try {
        const decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        const connection = await getConnection();
        const [user] = await connection.query("SELECT * FROM users WHERE id = ?", [decoded.id]);

        if (!user || user.refresh_token !== incomingRefreshToken) throw new ApiError(401, "Invalid or expired refresh token");

        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshTokens(user.id);

        res.cookie("accessToken", accessToken, { httpOnly: true, secure: true, sameSite: "None" });
        res.cookie("refreshToken", newRefreshToken, { httpOnly: true, secure: true, sameSite: "None" });
        res.status(200).json(new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, "Access token refreshed successfully"));
    } catch (error) {
        throw new ApiError(401, "Invalid refresh token");
    }
});

// Change user's current password
const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    const connection = await getConnection();
    const [user] = await connection.query("SELECT * FROM users WHERE id = ?", [req.user.id]);

    if (user.password !== oldPassword) throw new ApiError(400, "Invalid old password");

    await connection.query("UPDATE users SET password = ? WHERE id = ?", [newPassword, req.user.id]);
    res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"));
});

// Get current user's details
const getCurrentUser = asyncHandler(async (req, res) => {
    res.status(200).json(new ApiResponse(200, req.user, "User fetched successfully"));
});

// Update account details
const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body;

    if (!fullName || !email) throw new ApiError(400, "All fields are required");

    const connection = await getConnection();
    await connection.query("UPDATE users SET fullName = ?, email = ? WHERE id = ?", [fullName, email, req.user.id]);

    const [updatedUser] = await connection.query("SELECT * FROM users WHERE id = ?", [req.user.id]);
    res.status(200).json(new ApiResponse(200, updatedUser, "Account details updated successfully"));
});

// Get department-specific issues
const getDepartmentIssues = asyncHandler(async (req, res) => {
    const connection = await getConnection();
    const [issues] = await connection.query("SELECT * FROM issues WHERE require_department = ?", [req.user.department]);

    res.status(200).json(new ApiResponse(200, issues, "Issues fetched successfully"));
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    getDepartmentIssues,
};




// import bcrypt from "bcrypt";
// import { asyncHandler } from "../utils/asyncHandler.js";
// import { ApiError } from "../utils/ApiError.js";
// import { ApiResponse } from "../utils/ApiResponse.js";
// import jwt from "jsonwebtoken";
// import { getConnection } from "../db/index.js"; // Assuming you have a function to get a MySQL connection

// // Generate access and refresh tokens for a user
// const generateAccessAndRefreshTokens = async (userId) => {
//     try {
//         const connection = await getConnection();
        
//         // Query for the user
//         const [users] = await connection.query("SELECT * FROM users WHERE id = ?", [userId]);

//         // Check if user exists
//         if (users.length === 0) {
//             throw new ApiError(404, "User not found");
//         }

//         const user = users[0];

//         // Generate the access token with a short expiration time (15 minutes)
//         const accessToken = jwt.sign({ id: user.id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1d" });

//         // Generate the refresh token with a longer expiration time (7 days)
//         const refreshToken = jwt.sign({ id: user.id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

//         // Store the refresh token in the database
//         await connection.query("UPDATE users SET refresh_token = ? WHERE id = ?", [refreshToken, user.id]);

//         return { accessToken, refreshToken };
//     } catch (error) {
//         console.error("Error generating access and refresh tokens:", error.message); // Log the error
//         throw new ApiError(500, "Error generating access and refresh tokens");
//     }
// };

// const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

// // Helper function to generate JWT
// const generateToken = (userId) => {
//   return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "7d" });
// };

// // Register a new user
// const registerUser = async (req, res) => {
//   const { name, email, password, department_id, role } = req.body;

//   if (!name || !email || !password || !role) {
//     return res.status(400).json(new ApiResponse(400, null, "All fields are required"));
//   }

//   try {
//     const connection = await getConnection();

//     // Check if email is already registered
//     const [existingUser] = await connection.query("SELECT * FROM users WHERE email = ?", [email]);
//     if (existingUser.length > 0) {
//       return res.status(400).json(new ApiResponse(400, null, "Email already registered"));
//     }

//     // Hash the password
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Insert the new user
//     const [result] = await connection.query(
//       "INSERT INTO users (name, email, password, department_id, role) VALUES (?, ?, ?, ?, ?)",
//       [name, email, hashedPassword, department_id || null, role]
//     );

//     res.status(201).json(new ApiResponse(201, { userId: result.insertId, name, email, role }, "User registered successfully"));
//   } catch (error) {
//     console.error("Error registering user:", error);
//     res.status(500).json(new ApiResponse(500, null, "Internal server error"));
//   }
// };

// // Login a user
// const loginUser = async (req, res) => {
//   const { email, password } = req.body;

//   if (!email || !password) {
//     return res.status(400).json(new ApiResponse(400, null, "Email and password are required"));
//   }

//   try {
//     const connection = await getConnection();

//     // Find the user by email
//     const [user] = await connection.query("SELECT * FROM users WHERE email = ?", [email]);
//     if (user.length === 0) {
//       return res.status(404).json(new ApiResponse(404, null, "User not found"));
//     }

//     // Compare the password
//     const isPasswordValid = await bcrypt.compare(password, user[0].password);
//     if (!isPasswordValid) {
//       return res.status(401).json(new ApiResponse(401, null, "Invalid email or password"));
//     }

//     // Generate a token
//     const token = generateToken(user[0].id);

//     res.status(200).json(new ApiResponse(200, { token, userId: user[0].id, role: user[0].role }, "Login successful"));
//   } catch (error) {
//     console.error("Error logging in user:", error);
//     res.status(500).json(new ApiResponse(500, null, "Internal server error"));
//   }
// };

// // Get user profile
// const getUserProfile = async (req, res) => {
//   const { id } = req.user;

//   try {
//     const connection = await getConnection();

//     const [user] = await connection.query(
//       "SELECT id, name, email, department_id, role FROM users WHERE id = ?",
//       [id]
//     );

//     if (user.length === 0) {
//       return res.status(404).json(new ApiResponse(404, null, "User not found"));
//     }

//     res.status(200).json(new ApiResponse(200, user[0], "User profile fetched successfully"));
//   } catch (error) {
//     console.error("Error fetching user profile:", error);
//     res.status(500).json(new ApiResponse(500, null, "Internal server error"));
//   }
// };

// // Delete user
// const deleteUser = async (req, res) => {
//   const { userId } = req.params;

//   try {
//     const connection = await getConnection();

//     const [result] = await connection.query("DELETE FROM users WHERE id = ?", [userId]);
//     if (result.affectedRows === 0) {
//       return res.status(404).json(new ApiResponse(404, null, "User not found"));
//     }

//     res.status(200).json(new ApiResponse(200, { userId }, "User deleted successfully"));
//   } catch (error) {
//     console.error("Error deleting user:", error);
//     res.status(500).json(new ApiResponse(500, null, "Internal server error"));
//   }
// };

// // Update user role
// const updateUserRole = async (req, res) => {
//   const { userId } = req.params;
//   const { role } = req.body;

//   if (!role) {
//     return res.status(400).json(new ApiResponse(400, null, "Role is required"));
//   }

//   try {
//     const connection = await getConnection();

//     const [result] = await connection.query("UPDATE users SET role = ? WHERE id = ?", [role, userId]);
//     if (result.affectedRows === 0) {
//       return res.status(404).json(new ApiResponse(404, null, "User not found"));
//     }

//     res.status(200).json(new ApiResponse(200, { userId, role }, "User role updated successfully"));
//   } catch (error) {
//     console.error("Error updating user role:", error);
//     res.status(500).json(new ApiResponse(500, null, "Internal server error"));
//   }
// };

// // Change user's current password
// const changeCurrentPassword = asyncHandler(async (req, res) => {
//     const { oldPassword, newPassword } = req.body;

//     const connection = await getConnection();
//     const [user] = await connection.query("SELECT * FROM users WHERE id = ?", [req.user.id]);

//     if (user.password !== oldPassword) throw new ApiError(400, "Invalid old password");

//     await connection.query("UPDATE users SET password = ? WHERE id = ?", [newPassword, req.user.id]);
//     res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"));
// });

// // Get current user's details
// const getCurrentUser = asyncHandler(async (req, res) => {
//     res.status(200).json(new ApiResponse(200, req.user, "User fetched successfully"));
// });

// // Update account details
// const updateAccountDetails = asyncHandler(async (req, res) => {
//     const { fullName, email } = req.body;

//     if (!fullName || !email) throw new ApiError(400, "All fields are required");

//     const connection = await getConnection();
//     await connection.query("UPDATE users SET fullName = ?, email = ? WHERE id = ?", [fullName, email, req.user.id]);

//     const [updatedUser] = await connection.query("SELECT * FROM users WHERE id = ?", [req.user.id]);
//     res.status(200).json(new ApiResponse(200, updatedUser, "Account details updated successfully"));
// });

// // Get department-specific issues
// const getDepartmentIssues = asyncHandler(async (req, res) => {
//     const connection = await getConnection();
//     const [issues] = await connection.query("SELECT * FROM issues WHERE require_department = ?", [req.user.department]);

//     res.status(200).json(new ApiResponse(200, issues, "Issues fetched successfully"));
// });

// // Logout a user
// const logoutUser = asyncHandler(async (req, res) => {
//     const connection = await getConnection();
//     await connection.query("UPDATE users SET refresh_token = NULL WHERE id = ?", [req.user.id]);

//     res.clearCookie("accessToken", { httpOnly: true, secure: true, sameSite: "None" });
//     res.clearCookie("refreshToken", { httpOnly: true, secure: true, sameSite: "None" });
//     res.status(200).json(new ApiResponse(200, {}, "User logged out successfully"));
// });

// export {
//   registerUser,
//   loginUser,
//   logoutUser,
//   getUserProfile,
//   deleteUser,
//   updateUserRole,
//   updateAccountDetails,
//   changeCurrentPassword,
//   getCurrentUser,
//   getDepartmentIssues
// };
