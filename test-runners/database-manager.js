// database-manager.js - Manages database data display

import { UIManager } from './ui-manager.js';

// Database Data Manager for handling database data display
export class DatabaseDataManager {
  static async loadTableList() {
    try {
      console.log('Loading database table list...');
      const dataContent = document.getElementById('data-content');
      if (!dataContent) {
        console.error('Data content element not found');
        return;
      }
      
      // Show loading message
      dataContent.innerHTML = '<p>Loading available tables...</p>';
      
      // Hide any previous error
      const errorElement = document.getElementById('data-error');
      if (errorElement) {
        errorElement.style.display = 'none';
      }
      
      const response = await fetch('/db-data');
      const result = await response.json();
      
      if (result.success) {
        // Populate the table selector dropdown
        const tableSelect = document.getElementById('table-select');
        tableSelect.innerHTML = '<option value="">-- Select a table --</option>';
        
        result.tables.forEach(table => {
          const option = document.createElement('option');
          option.value = table;
          option.textContent = table;
          tableSelect.appendChild(option);
        });
        
        dataContent.innerHTML = '<p>Select a table from the dropdown to view its data.</p>';
      } else {
        dataContent.innerHTML = `<p>Error loading tables: ${result.message}</p>`;
      }
    } catch (error) {
      console.error('Error loading table list', error);
      document.getElementById('data-content').innerHTML = '<p>Failed to load table list. Please try again.</p>';
      document.getElementById('data-error').style.display = 'block';
      document.getElementById('data-error').textContent = `Error: ${error.message}`;
    }
  }
  
  static async loadTableData(tableName) {
    try {
      console.log(`Loading data for table: ${tableName}`);
      const dataContent = document.getElementById('data-content');
      if (!dataContent) {
        console.error('Data content element not found');
        return;
      }
      
      // Show loading message
      dataContent.innerHTML = `<p>Loading data for ${tableName}...</p>`;
      
      // Hide any previous error
      const errorElement = document.getElementById('data-error');
      if (errorElement) {
        errorElement.style.display = 'none';
      }
      
      const response = await fetch(`/db-data?table=${tableName}`);
      const result = await response.json();
      
      if (result.success) {
        // Render the table data
        DatabaseDataManager.renderTableData(result);
      } else {
        dataContent.innerHTML = `<p>Error loading data: ${result.message}</p>`;
      }
    } catch (error) {
      console.error(`Error loading data for table: ${tableName}`, error);
      document.getElementById('data-content').innerHTML = '<p>Failed to load table data. Please try again.</p>';
      document.getElementById('data-error').style.display = 'block';
      document.getElementById('data-error').textContent = `Error: ${error.message}`;
    }
  }
  
  static renderTableData(data) {
    const dataContent = document.getElementById('data-content');
    const { table, columns, rows, total } = data;
    
    // Create table container
    const tableContainer = document.createElement('div');
    tableContainer.className = 'data-table';
    
    // Add table header
    const tableHeader = document.createElement('h3');
    tableHeader.textContent = `Table: ${table}`;
    tableContainer.appendChild(tableHeader);
    
    // Create table element
    const tableElement = document.createElement('table');
    
    // Create table header row
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    columns.forEach(column => {
      const th = document.createElement('th');
      th.textContent = column;
      headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    tableElement.appendChild(thead);
    
    // Create table body with data rows
    const tbody = document.createElement('tbody');
    
    rows.forEach(row => {
      const tr = document.createElement('tr');
      
      columns.forEach(column => {
        const td = document.createElement('td');
        const value = row[column];
        
        // Format the value based on its type
        if (value === null || value === undefined) {
          td.textContent = 'NULL';
          td.className = 'null-value';
        } else if (typeof value === 'object') {
          td.textContent = JSON.stringify(value);
        } else {
          td.textContent = value.toString();
        }
        
        tr.appendChild(td);
      });
      
      tbody.appendChild(tr);
    });
    
    tableElement.appendChild(tbody);
    tableContainer.appendChild(tableElement);
    
    // Add table info
    const tableInfo = document.createElement('div');
    tableInfo.className = 'data-info';
    tableInfo.textContent = `Total rows: ${total}`;
    tableContainer.appendChild(tableInfo);
    
    // Clear previous content and add the new table
    dataContent.innerHTML = '';
    dataContent.appendChild(tableContainer);
  }
  
  static async refreshData() {
    const tableSelect = document.getElementById('table-select');
    const selectedTable = tableSelect.value;
    
    if (selectedTable) {
      await DatabaseDataManager.loadTableData(selectedTable);
    } else {
      await DatabaseDataManager.loadTableList();
    }
  }
}
