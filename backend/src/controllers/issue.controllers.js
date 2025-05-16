import { getConnection } from "../db/index.js";  // Assuming you have a connection utility
import { sendEmail } from "../utils/emailService.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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
    const { issue, description, address, requireDepartment } = req.body;

    if ([issue, address, requireDepartment].some((field) => field?.trim() === "")) {
        return res.status(400).json(new ApiResponse(400, null, "All fields are required"));
    }

    const connection = await getConnection();
    const [dept] = await connection.query("SELECT department_id FROM departments WHERE name = ?", requireDepartment);
    const [availableUser] = await connection.query("SELECT * FROM users WHERE department_id = ?", dept[0].department_id);

    if (!availableUser) {
        return res.status(401).json(new ApiResponse(401, null, "Required department is not available"));
    }

    const createdAt = giveTime();  // Returns correct date format
    const updatedAt = giveTime();  // Returns correct date format

    await connection.query("INSERT INTO issues (issue, description, address, require_department_id, user_id, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        [issue, description, address, dept[0].department_id, req.user.id, createdAt]);
    
    const User = availableUser[0];
    
    // Check if email exists
    if (User.email) {
        // Send email to the department user
        const subject = 'New Issue Assigned';
        const text = `Dear ${User.fullName},\n\nYou have been assigned a new issue:\n\nIssue: ${issue}\nDescription: ${description}\nAddress: ${address}\n\nPlease address this issue as soon as possible.\n\nThank you,\nUAIMS HR`;

        await sendEmail(User.email, subject, text);
    } else {
        console.error("Email not available for user", User);
    }

    res.status(200).json(new ApiResponse(200, { issue, description, address, requireDepartment }, "Issue created successfully"));
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

    if (!issue) {
        return res.status(404).json(new ApiResponse(404, null, "No issue found with the provided ID for this user"));
    }

    await connection.query("UPDATE issues SET complete = true, updated_at = ? WHERE id = ?", [giveTime(), issueId]);
    // await connection.query("UPDATE responses SET complete = true WHERE issueId = ?", [issueId]);

    // const [responses] = await connection.query("SELECT * FROM responses WHERE issueId = ?", [issueId]);
    res.status(200).json(new ApiResponse(200, { issue }, "Issue marked as complete successfully"));
};

// Acknowledge a response
const acknowledgeResponse = async (req, res) => {
    const { responseId } = req.body;
    const connection = await getConnection();

    // const [response] = await connection.query("SELECT * FROM responses WHERE id = ?", [responseId]);

    // if (!response) {
    //     return res.status(404).json(new ApiResponse(404, null, "No response found with the provided ID"));
    // }

    const currentTime = giveTime();
    console.log(responseId);
    
    await connection.query("UPDATE issues SET acknowledge_at = ? WHERE id = ?", [currentTime, responseId]);
    // await connection.query("UPDATE responses SET acknowledge_at = ? WHERE id = ?", [currentTime, responseId]);

    res.status(200).json(new ApiResponse(200, "Response acknowledged successfully"));
};

// Fetch completed problems
const fetchReport = async (req, res) => {
    const connection = await getConnection();
    
    const [problems] = await connection.query(`
        SELECT id,issue,description,address,require_department_id,complete,user_id,
            DATE_FORMAT(CONVERT_TZ(acknowledge_at, '+00:00','+00:00'), '%d-%m-%Y %H:%i:%s') AS acknowledge_at,
            DATE_FORMAT(CONVERT_TZ(created_at, '+00:00','+00:00'), '%d-%m-%Y %H:%i:%s') AS created_at,
    DATE_FORMAT(CONVERT_TZ(updated_at, '+00:00', '+00:00'), '%d-%m-%Y %H:%i:%s') AS updated_at
        FROM issues
    `);

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