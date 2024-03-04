import React, { useState, useEffect } from "react";
import axios from "axios";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import Chart from "chart.js/auto";
import { CSVLink } from "react-csv";
import ExcelJS from "exceljs";

const MyGridComponent = () => {
  const [rowData, setRowData] = useState([]);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const apiKey = "WTZK2QDXI5M6WX71J29FEVTXV58NGF54Y3";
        const apiUrl = `https://api.etherscan.io/api?module=account&action=txlist&address=0x6Fb447Ae94F5180254D436A693907a1f57696900&startblock=16689267&endblock=18982605&sort=asc&apikey=${apiKey}`;

        const response = await axios.get(apiUrl);
        setRowData(response?.data?.result);

        plotGraph(response?.data?.result);
        console.log("anii", response.data.result);
      } catch (error) {
        console.log("Error fetching data:", error);
      }
    };

    fetchTransactions();
  }, []);

  const plotGraph = (data) => {
    const groupedData = data.reduce((acc, transaction) => {
      const blockNumber = transaction.blockNumber;
      const gasUsed = parseInt(transaction.gasUsed);
      if (!acc[blockNumber]) {
        acc[blockNumber] = { totalGas: 0, count: 0 };
      }
      acc[blockNumber].totalGas += gasUsed;
      acc[blockNumber].count++;
      return acc;
    }, {});

    const labels = [];
    const dataPoints = [];

    for (const blockNumber in groupedData) {
      if (groupedData.hasOwnProperty(blockNumber)) {
        const averageGas =
          groupedData[blockNumber].totalGas / groupedData[blockNumber].count;
        labels.push(blockNumber);
        dataPoints.push(averageGas);
      }
    }
    const ctx = document.getElementById("gasUsedChart");
    if (ctx) {
      const chart = Chart.getChart(ctx);
      if (chart) {
        chart.destroy();
      }
    }
    new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Average Gas Used Per Block",
            data: dataPoints,
            borderColor: "rgb(75, 192, 192)",
            tension: 0.1,
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  };

  const columnDefs = [
    { headerName: "blockNumber", field: "blockNumber" },
    { headerName: "hash", field: "hash" },
    { headerName: "to", field: "to" },
    { headerName: "value", field: "value" },
    { headerName: "gas", field: "gas" },
    { headerName: "gasPrice", field: "gasPrice" },
    { headerName: "gasUsed", field: "gasUsed" },
    { headerName: "functionName", field: "input" },
  ];

  const exportToExcel = () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Transactions");
    const headers = Object.keys(rowData[0]);
    worksheet.addRow(headers);
    rowData.forEach((data) => {
      const row = [];
      headers.forEach((header) => {
        row.push(data[header]);
      });
      worksheet.addRow(row);
    });
    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "transactions.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div>
      <div
        className="ag-theme-alpine"
        style={{ height: "530px", width: "100%" }}
      >
        <AgGridReact
          columnDefs={columnDefs}
          rowData={rowData}
          domLayout="autoHeight"
          pagination={true}
          paginationPageSize={10}
          suppressRowClickSelection={true}
          enableRangeSelection={true}
          defaultColDef={{
            resizable: true,
            sortable: true,
            filter: true,
          }}
          suppressExcelExport={false}
          excelStyles={["border-bottom"]}
          suppressCsvExport={false}
        />
      </div>
      <div style={{ marginTop: "20px" }}>
        <CSVLink
          data={rowData}
          filename={"transactions.csv"}
          className="btn btn-primary"
          target="_blank"
        >
          Export CSV
        </CSVLink> &nbsp;
        <button className="btn btn-primary" onClick={exportToExcel}>
          Export Excel
        </button>
      </div>
      <div style={{ marginTop: "30px" }}>
        <canvas id="gasUsedChart" width="800" height="400"></canvas>
      </div>
    </div>
  );
};

export default MyGridComponent;
