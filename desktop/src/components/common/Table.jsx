import React, { useState } from 'react';
import './Table.css';
import Button from './Button';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

export const Table = ({
  columns, // [{ header: 'Name', key: 'name', render: (row) => ... }]
  data,
  searchPlaceholder = 'Search records...',
  searchKey = 'name',
  onEdit,
  onDelete,
  actionsLabel = 'Actions'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Filter based on search term
  const filteredData = data.filter(row => {
    const value = row[searchKey];
    if (!value) return true;
    return value.toString().toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="table-container">
      <div className="table-toolbar">
        <div className="table-search-wrapper">
          <Search size={18} className="table-search-icon" />
          <input
            type="text"
            className="form-input table-search"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      <div className="table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th key={idx}>{col.header || col.label}</th>
              ))}
              {(onEdit || onDelete) && <th style={{ textAlign: 'right' }}>{actionsLabel}</th>}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rowIdx) => (
                <tr key={row.id || rowIdx}>
                  {columns.map((col, colIdx) => (
                    <td key={colIdx}>
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                  {(onEdit || onDelete) && (
                    <td className="table-actions">
                      {onEdit && (
                        <button onClick={() => onEdit(row)} className="table-action-btn edit-btn" title="Edit">
                          Edit
                        </button>
                      )}
                      {onDelete && (
                        <button onClick={() => onDelete(row)} className="table-action-btn delete-btn" title="Delete">
                          Delete
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length + ((onEdit || onDelete) ? 1 : 0)} className="table-empty">
                  No matching records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="table-pagination">
          <span className="pagination-info">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredData.length)} of {filteredData.length} records
          </span>
          <div className="pagination-buttons">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} />
            </Button>
            <span className="pagination-current">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Table;
