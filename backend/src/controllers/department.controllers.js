import { getConnection } from "../db/index.js";  
import { ApiResponse } from "../utils/ApiResponse.js";

const addDepartment = async (req, res) => {
  const { name, type } = req.body;

  // Validate required fields
  if (!name || !type) {
    return res.status(400).json(new ApiResponse(400, null, "Name and Type are required"));
  }

  try {
    const connection = await getConnection();
    await connection.query("INSERT INTO departments (name, type) VALUES (?, ?)", [name, type]);

    res.status(201).json(new ApiResponse(201, { name, type }, "Department added successfully"));
  } catch (error) {
    console.error("Error adding department:", error);
    res.status(500).json(new ApiResponse(500, null, "Internal server error"));
  }
};

const deleteDepartment = async (req, res) => {
  const { departmentId } = req.params;

  try {
    const connection = await getConnection();
    const [result] = await connection.query("DELETE FROM departments WHERE department_id = ?", [departmentId]);

    if (result.affectedRows === 0) {
      return res.status(404).json(new ApiResponse(404, null, "Department not found"));
    }

    res.status(200).json(new ApiResponse(200, { departmentId }, "Department deleted successfully"));
  } catch (error) {
    console.error("Error deleting department:", error);
    res.status(500).json(new ApiResponse(500, null, "Internal server error"));
  }
};

const updateDepartmentType = async (req, res) => {
  const { departmentId } = req.params;
  const { type } = req.body;

  if (!type) {
    return res.status(400).json(new ApiResponse(400, null, "Type is required"));
  }

  try {
    const connection = await getConnection();
    const [result] = await connection.query("UPDATE departments SET type = ? WHERE department_id = ?", [type, departmentId]);

    if (result.affectedRows === 0) {
      return res.status(404).json(new ApiResponse(404, null, "Department not found"));
    }

    res.status(200).json(new ApiResponse(200, { departmentId, type }, "Department type updated successfully"));
  } catch (error) {
    console.error("Error updating department type:", error);
    res.status(500).json(new ApiResponse(500, null, "Internal server error"));
  }
};

const checkDepartmentType = async (req, res) => {
  const { name } = req.params;

  try {
    const connection = await getConnection();
    const [rows] = await connection.query("SELECT type FROM departments WHERE name = ?", [name]);

    if (rows.length === 0) {
      return res.status(404).json(new ApiResponse(404, null, "Department not found"));
    }

    const departmentType = rows[0].type;
    res.status(200).json(new ApiResponse(200, { name, type: departmentType }, "Department type fetched successfully"));
  } catch (error) {
    console.error("Error fetching department type:", error);
    res.status(500).json(new ApiResponse(500, null, "Internal server error"));
  }
};



export {
  addDepartment,
  deleteDepartment,
  updateDepartmentType,
  checkDepartmentType,
};

