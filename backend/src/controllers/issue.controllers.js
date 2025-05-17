import { getConnection } from "../db/index.js";  // Assuming you have a connection utility
import { sendEmail } from "../utils/emailService.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

// Helper function to get the current time in DD/MM/YYYY HH:MM:SS format
const giveTime = () => {
    const currentTime = new Date();
    const year = currentTime.getFullYear();
    const month = String(currentTime.getMonth() + 1).padStart(2, '0');
    const day = String(currentTime.getDate()).padStart(2, '0');
    const hours = String(currentTime.getHours()).padStart(2, '0');
    const minutes = String(currentTime.getMinutes()).padStart(2, '0');
    const seconds = String(currentTime.getSeconds()).padStart(2, '0');

    // Return the date in the format 'YYYY-MM-DD HH:MM:SS'
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};


// Create a new issue
const createIssue = async (req, res) => {
    try {
        const { issue, description, address, requireDepartment } = req.body;

        if ([issue, address, requireDepartment].some((field) => field?.trim() === "")) {
            return res.status(400).json(new ApiResponse(400, null, "All fields are required"));
        }

        const connection = await getConnection();
        
        // Check if department exists
        const [dept] = await connection.query("SELECT department_id FROM departments WHERE name = ?", requireDepartment);
        
        if (!dept || dept.length === 0) {
            return res.status(404).json(new ApiResponse(404, null, "Department not found"));
        }
        
        // Check if there are users in the department
        const [availableUsers] = await connection.query("SELECT * FROM users WHERE department_id = ?", dept[0].department_id);
        
        let warningMessage = null;
        if (!availableUsers || availableUsers.length === 0) {
            warningMessage = "Warning: No users available in the required department. Issue will be created but cannot be assigned.";
        }

        const createdAt = giveTime();  // Returns correct date format

        // Insert the issue
        const [result] = await connection.query(
            "INSERT INTO issues (issue, description, address, require_department_id, user_id, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            [issue, description, address, dept[0].department_id, req.user.id, createdAt]
        );
        
        // If users are available, send email notification
        if (availableUsers && availableUsers.length > 0) {
            // Select a user from the department to notify (first user)
            const targetUser = availableUsers[0];
            
            // Send email notification if the user has an email
            if (targetUser && targetUser.email) {
                // Send email to the department user
                const subject = 'New Issue Assigned';
                const text = `Dear ${targetUser.fullName || targetUser.username},\n\nYou have been assigned a new issue:\n\nIssue: ${issue}\nDescription: ${description}\nAddress: ${address}\n\nPlease address this issue as soon as possible.\n\nThank you,\nUAIMS HR`;

                await sendEmail(targetUser.email, subject, text);
            } else {
                console.warn("Email not available for user in department", requireDepartment);
            }
        } else {
            console.warn("No users available in department", requireDepartment);
        }

        return res.status(201).json(
            new ApiResponse(201, 
                { 
                    id: result.insertId,
                    issue, 
                    description, 
                    address, 
                    requireDepartment,
                    warning: warningMessage
                }, 
                warningMessage || "Issue created successfully"
            )
        );
    } catch (error) {
        console.error("Error creating issue:", error);
        return res.status(500).json(
            new ApiResponse(500, null, "An error occurred while creating the issue: " + error.message)
        );
    }
};



// Fetch issues for a department
const getissue = async (req, res) => {
    const connection = await getConnection();
    
    const [departmentId] = await connection.query("SELECT department_id FROM users WHERE id = ? ", [req.user.id]);    

    const [issues] = await connection.query("SELECT * FROM issues WHERE require_department_id = ? AND complete = false", [departmentId[0].department_id]);
    
    res.status(200).json(new ApiResponse(200, issues, "Issues fetched successfully"));
};

// Fetch issues for a user
const getIssueforuser = async (req, res) => {
    const connection = await getConnection();
    
    const [issues] = await connection.query("SELECT * FROM issues WHERE user_id = ? AND complete = false", [req.user.id]);

    res.status(200).json(new ApiResponse(200, issues, "Issues fetched successfully for the user"));
};

// Update responses for a department
const updateResponses = async (req, res) => {
    const { description, requirements, actionTaken, complete } = req.body;
    const connection = await getConnection();

    const [issues] = await connection.query("SELECT * FROM issues WHERE requireDepartment = ?", [req.user.department]);

    if (issues.length === 0) {
        return res.status(404).json(new ApiResponse(404, null, "No issues found for the department"));
    }

    const updatedResponses = [];

    for (const issue of issues) {
        const [response] = await connection.query("SELECT * FROM responses WHERE issueId = ?", [issue._id]);
        if (response) {
            const [updatedResponse] = await connection.query(
                "UPDATE responses SET description = ?, requirements = ?, actionTaken = ?, complete = ? WHERE issueId = ?",
                [description, requirements, actionTaken, complete, issue._id]
            );
            updatedResponses.push(updatedResponse);
        }
    }

    if (updatedResponses.length === 0) {
        return res.status(404).json(new ApiResponse(404, null, "No responses found to update"));
    }

    res.status(200).json(new ApiResponse(200, updatedResponses, "Responses updated successfully"));
};

// Complete a specific report
const completeIssue = async (req, res) => {
    const { issueId } = req.body;
    const connection = await getConnection();

    const [issue] = await connection.query("SELECT * FROM issues WHERE id = ?", [issueId]);

    if (!issue || issue.length === 0) {
        return res.status(404).json(new ApiResponse(404, null, "No issue found with the provided ID for this user"));
    }

    // Only update the complete flag and updated_at timestamp, preserve acknowledge_at
    await connection.query("UPDATE issues SET complete = true, updated_at = ? WHERE id = ?", [giveTime(), issueId]);

    res.status(200).json(new ApiResponse(200, { issue: issue[0] }, "Issue marked as complete successfully"));
};

// Acknowledge a response
const acknowledgeResponse = async (req, res) => {
    const { responseId } = req.body;
    const connection = await getConnection();

    // First, get the current issue status to preserve completion status
    const [currentIssue] = await connection.query("SELECT * FROM issues WHERE id = ?", [responseId]);
    
    if (!currentIssue || currentIssue.length === 0) {
        return res.status(404).json(new ApiResponse(404, null, "No issue found with the provided ID"));
    }

    const currentTime = giveTime();
    console.log(responseId);
    
    // Update only the acknowledge_at field, explicitly setting complete to false
    await connection.query("UPDATE issues SET acknowledge_at = ?, complete = false WHERE id = ?", [currentTime, responseId]);

    res.status(200).json(new ApiResponse(200, "Response acknowledged successfully"));
};

const fetchReport = async (req, res) => {
    const connection = await getConnection();

    const [problems] = await connection.query(`
        SELECT 
            i.id,
            i.issue,
            i.description,
            i.address,
            rd.name AS required_department_name,
            u.full_name AS user_name,
            ud.name AS user_department_name,
            i.complete,
            DATE_FORMAT(CONVERT_TZ(i.acknowledge_at, '+00:00','+00:00'), '%d-%m-%Y %H:%i:%s') AS acknowledge_at,
            DATE_FORMAT(CONVERT_TZ(i.created_at, '+00:00','+00:00'), '%d-%m-%Y %H:%i:%s') AS created_at,
            DATE_FORMAT(CONVERT_TZ(i.updated_at, '+00:00','+00:00'), '%d-%m-%Y %H:%i:%s') AS updated_at
        FROM 
            issues i
        JOIN 
            departments rd ON i.require_department_id = rd.department_id
        LEFT JOIN 
            users u ON i.user_id = u.id
        LEFT JOIN 
            departments ud ON u.department_id = ud.department_id
    `);

    // console.log(problems);

    res.status(200).json(new ApiResponse(200, problems, "Completed problems and responses fetched successfully"));
};


// Fetch admin's department
const getAdmin = async (req, res) => {
    res.status(200).json(new ApiResponse(200, req.user.department, "Department fetched successfully for the user"));
};

export {
    createIssue,
    getissue,
    getIssueforuser,
    updateResponses,
    completeIssue,
    acknowledgeResponse,
    fetchReport,
    getAdmin,
};