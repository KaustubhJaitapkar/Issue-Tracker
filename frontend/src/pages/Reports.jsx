import { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import Header from './Header';

function Reports() {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportedDeptFilter, setReportedDeptFilter] = useState('');
  const [requiredDeptFilter, setRequiredDeptFilter] = useState('');

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');

    axios.get('http://localhost:8000/api/v1/fetch-report', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      withCredentials: true,
    })
    .then((response) => {
      setTasks(response.data.data);
      setFilteredTasks(response.data.data);
    })
    .catch((error) => {
      console.log(error);
    });
  }, []);

  const parseDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return null;

    const [datePart, timePart] = dateTimeStr.split(' ');
    const [day, month, year] = datePart.split('-').map(Number);
    const [hours, minutes, seconds] = timePart.split(':').map(Number);

    return new Date(year, month - 1, day, hours, minutes, seconds);
  };

  const filterByDate = () => {

    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    const filtered = tasks.filter((task) => {
      const createdAt = parseDateTime(task.created_at)?.getTime();

      const matchesDate = createdAt &&
      (start ? createdAt >= start : true) &&
      (end ? createdAt <= end : true);
      const matchesReportedDept = reportedDeptFilter ? task.user_department_name === reportedDeptFilter : true;
      const matchesRequiredDept = requiredDeptFilter ? task.required_department_name === requiredDeptFilter : true;

      return matchesDate && matchesReportedDept && matchesRequiredDept;
    });

    setFilteredTasks(filtered);
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredTasks.map(task => ({
      Problem: task.issue,
      Description: task.description || 'None',
      Address: task.address,
      Completed: task.complete ? 'Yes' : 'No',
      "Reported Department": task.user_department_name,
      "Required Department": task.required_department_name,
      "Acknowledge Time": task.acknowledge_at,
      "Created Time": task.created_at,
      "Resolved Time": task.updated_at !== task.created_at ? task.updated_at : '-'
    })));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tasks Report");

    XLSX.writeFile(workbook, "Tasks_Report.xlsx");
  };

  return (
    <>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />

        <main className="px-4 sm:px-6 lg:px-8 py-8">
          <section className="text-center">
            <h2 className="text-2xl font-semibold text-indigo-700 mb-6">Problems Report</h2>

            {/* Filters */}
            <div className="flex flex-wrap justify-center mb-6 gap-4">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border px-3 py-2 rounded shadow-sm"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border px-3 py-2 rounded shadow-sm"
              />

              <select
                value={reportedDeptFilter}
                onChange={(e) => setReportedDeptFilter(e.target.value)}
                className="border px-3 py-2 rounded shadow-sm"
              >
                <option value="">All Reported Depts</option>
                {[...new Set(tasks.map((task) => task.user_department_name))].map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>

              <select
                value={requiredDeptFilter}
                onChange={(e) => setRequiredDeptFilter(e.target.value)}
                className="border px-3 py-2 rounded shadow-sm"
              >
                <option value="">All Required Depts</option>
                {[...new Set(tasks.map((task) => task.required_department_name))].map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>

              <button
                onClick={filterByDate}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 transition"
              >
                Filter
              </button>
              <button
                onClick={exportToExcel}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
              >
                Export to Excel
              </button>
            </div>

            {/* Table Headings */}
            <div className="grid grid-cols-9 gap-4 bg-indigo-600 text-white py-3 m-0 rounded-lg shadow-lg text-sm sm:text-md">
              <h3 className="font-semibold">Problem</h3>
              <h3 className="font-semibold">Description</h3>
              <h3 className="font-semibold">Address</h3>
              <h3 className="font-semibold">Completed</h3>
              <h3 className="font-semibold">Department Reported</h3>
              <h3 className="font-semibold">Required Department</h3>
              <h3 className="font-semibold">Acknowledge Time</h3>
              <h3 className="font-semibold">Created Time</h3>
              <h3 className="font-semibold">Resolved Time</h3>
            </div>

            {/* Task List */}
            <div className="overflow-y-auto max-h-[430px] bg-white mt-4 rounded-lg shadow-2xl">
              {filteredTasks && filteredTasks.length > 0 ? (
                filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className="grid grid-cols-9 gap-4 p-3 border-b border-gray-200 text-xs sm:text-sm hover:bg-indigo-50 transition-colors"
                  >
                    <p className="text-gray-700">{task.issue}</p>
                    <p className="text-gray-700">{task.description || 'None'}</p>
                    <p className="text-gray-700">{task.address}</p>
                    <p className={task.complete ? 'text-green-600' : 'text-red-500'}>
                      {task.complete ? 'Yes' : 'No'}
                    </p>
                    <p className="text-gray-700">{task.user_department_name}</p>
                    <p className="text-gray-700">{task.required_department_name}</p>
                    <p className="text-gray-500">{task.acknowledge_at}</p>
                    <p className="text-gray-500">{task.created_at}</p>
                    <p className="text-gray-500">
                      {task.complete === 1 ? task.updated_at : '-'}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-center p-4 text-gray-500">No tasks available</p>
              )}
            </div>
          </section>
        </main>
      </div>
    </>
  );
}

export default Reports;
