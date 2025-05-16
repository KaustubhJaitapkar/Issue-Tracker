import bcrypt from "bcrypt";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { getConnection } from "../db/index.js";
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
        const accessToken = jwt.sign(
            { 
                id: user.id, 
                is_admin: user.is_admin 
            }, 
            process.env.ACCESS_TOKEN_SECRET, 
            { expiresIn: "1d" }
        );

        // Generate the refresh token with a longer expiration time (7 days)
        const refreshToken = jwt.sign({ id: user.id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

        return { accessToken, refreshToken };
    } catch (error) {
        console.error("Error generating access and refresh tokens:", error.message); // Log the error
        throw new ApiError(500, "Error generating access and refresh tokens");
    }
};


// Register a new user
const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, username, password, department, phoneNumber, isAdmin } = req.body;

    if ([fullName, email, username, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    const connection = await getConnection();

    // Fetch existing user
    const [existingUser] = await connection.query(
        "SELECT * FROM users WHERE id = ? OR email = ?",
        [username, email]
    );

    if (existingUser.length > 0) {
        throw new ApiError(409, "User with email or username already exists");
    }

    // Only check department if not creating an admin user
    let departmentId = null;
    if (!isAdmin && department) {
        const [existingDept] = await connection.query(
            "SELECT department_id FROM departments WHERE name = ?",
            [department]
        );

        if (existingDept.length === 0) {
            throw new ApiError(409, "Department does not exist");
        }
        departmentId = existingDept[0].department_id;
    } else if (!isAdmin && !department) {
        throw new ApiError(400, "Department is required for non-admin users");
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Set is_admin field based on the request
    const is_admin = isAdmin ? 1 : 0;

    await connection.query(
        "INSERT INTO users (full_name, email, id, password, department_id, phone_number, is_admin) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [fullName, email, username.toLowerCase(), hashedPassword, departmentId, phoneNumber, is_admin]
    );

    res.status(200).json({statusCode: 200, message: is_admin ? "Admin registered successfully" : "User registered successfully"});
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
        fullName: user.full_name,
        phoneNumber: user.phone_number,
        department: user.department_id,
        is_admin: user.is_admin || false
    };

    // Set cookies and send response
    res.cookie("accessToken", accessToken, { httpOnly: true, secure: true, sameSite: "None" });
    
    // Return different message based on user type
    const successMessage = user.is_admin ? "Admin logged in successfully" : "User logged in successfully";
    
    res.status(200).json(
        new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, successMessage)
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

// Admin: Create a new user (admin can create both regular and admin users)
const adminCreateUser = asyncHandler(async (req, res) => {
    const { fullName, email, username, password, department, phoneNumber, isAdmin } = req.body;

    // Validate required fields
    if ([fullName, email, username, password].some((field) => !field || field.trim() === "")) {
        throw new ApiError(400, "All required fields must be provided");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new ApiError(400, "Please provide a valid email address");
    }

    // Validate phone number format (optional field)
    if (phoneNumber && !/^\d{10,15}$/.test(phoneNumber.replace(/[^\d]/g, ''))) {
        throw new ApiError(400, "Please provide a valid phone number");
    }

    const connection = await getConnection();

    // Check if user already exists with same username or email
    const [existingUser] = await connection.query(
        "SELECT * FROM users WHERE id = ? OR email = ?",
        [username, email]
    );

    if (existingUser.length > 0) {
        // Check which field caused the conflict
        if (existingUser[0].id === username) {
            throw new ApiError(409, "Username already exists");
        } else if (existingUser[0].email === email) {
            throw new ApiError(409, "Email already exists");
        } else {
            throw new ApiError(409, "User with email or username already exists");
        }
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Set is_admin field based on the request
    const is_admin = isAdmin ? 1 : 0;

    let departmentId = null;
    
    // Only check for department if user is not an admin or if department is specified for an admin
    if (!is_admin || (is_admin && department)) {
        if (!department && !is_admin) {
            throw new ApiError(400, "Department is required for regular users");
        }
        
        if (department) {
            const [existingDept] = await connection.query(
                "SELECT department_id FROM departments WHERE name = ?",
                [department]
            );

            if (existingDept.length === 0) {
                throw new ApiError(404, "Department not found");
            }
            
            departmentId = existingDept[0].department_id;
        }
    }

    // Insert the new user
    await connection.query(
        "INSERT INTO users (full_name, email, id, password, department_id, phone_number, is_admin) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [fullName, email, username.toLowerCase(), hashedPassword, departmentId, phoneNumber, is_admin]
    );

    res.status(201).json(
        new ApiResponse(201, { 
            username, 
            email, 
            isAdmin: !!is_admin,
            department: department || null 
        }, 
        is_admin ? "Admin user created successfully" : "User created successfully")
    );
});

// Admin: Get all users
const adminGetAllUsers = asyncHandler(async (req, res) => {
    const connection = await getConnection();
    
    // Get all users with their department information
    const [users] = await connection.query(`
        SELECT u.id, u.full_name, u.email, u.phone_number, 
               u.is_admin, u.created_at, d.name AS department_name 
        FROM users u
        LEFT JOIN departments d ON u.department_id = d.department_id
        ORDER BY u.created_at DESC
    `);

    res.status(200).json(
        new ApiResponse(200, { users }, "Users fetched successfully")
    );
});

// Admin: Update user
const adminUpdateUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { fullName, email, phoneNumber, department, isAdmin } = req.body;

    const connection = await getConnection();

    // Check if user exists
    const [userExists] = await connection.query("SELECT * FROM users WHERE id = ?", [userId]);
    if (userExists.length === 0) {
        throw new ApiError(404, "User not found");
    }

    // Check if we're changing user to/from admin
    const currentIsAdmin = userExists[0].is_admin;
    const changingToAdmin = isAdmin !== undefined && isAdmin && !currentIsAdmin;
    const changingFromAdmin = isAdmin !== undefined && !isAdmin && currentIsAdmin;
    
    let departmentId = userExists[0].department_id;
    
    // Handle department changes
    if (department) {
        const [deptResult] = await connection.query(
            "SELECT department_id FROM departments WHERE name = ?", 
            [department]
        );
        
        if (deptResult.length === 0) {
            throw new ApiError(404, "Department not found");
        }
        
        departmentId = deptResult[0].department_id;
    } else if (changingToAdmin) {
        // If changing to admin and no department specified, set department to NULL
        departmentId = null;
    } else if (changingFromAdmin && !department) {
        // If changing from admin to regular user, require a department
        throw new ApiError(400, "Department is required when changing from admin to regular user");
    }

    // Build update query dynamically based on provided fields
    const updateFields = [];
    const updateValues = [];

    if (fullName) {
        updateFields.push("full_name = ?");
        updateValues.push(fullName);
    }

    if (email) {
        updateFields.push("email = ?");
        updateValues.push(email);
    }

    if (phoneNumber) {
        updateFields.push("phone_number = ?");
        updateValues.push(phoneNumber);
    }

    // Always update department_id if we're changing admin status
    if (department || changingToAdmin || changingFromAdmin) {
        updateFields.push("department_id = ?");
        updateValues.push(departmentId);
    }

    if (isAdmin !== undefined) {
        updateFields.push("is_admin = ?");
        updateValues.push(isAdmin ? 1 : 0);
    }

    if (updateFields.length === 0) {
        throw new ApiError(400, "No fields provided for update");
    }

    // Add user ID to values
    updateValues.push(userId);

    // Execute update
    await connection.query(
        `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`,
        updateValues
    );

    res.status(200).json(
        new ApiResponse(200, { userId }, "User updated successfully")
    );
});

// Admin: Delete user
const adminDeleteUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    
    const connection = await getConnection();
    
    // Check if user exists
    const [userExists] = await connection.query("SELECT * FROM users WHERE id = ?", [userId]);
    if (userExists.length === 0) {
        throw new ApiError(404, "User not found");
    }
    
    // Delete the user
    await connection.query("DELETE FROM users WHERE id = ?", [userId]);
    
    res.status(200).json(
        new ApiResponse(200, { userId }, "User deleted successfully")
    );
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
    adminCreateUser,
    adminGetAllUsers,
    adminUpdateUser,
    adminDeleteUser,
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
