import React from 'react';

// Props interface for Pagination
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/**
 * Pagination component for navigating through pages of content
 */
const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange
}) => {
  // Don't render pagination if there's only one page or no pages
  if (totalPages <= 1) {
    return null;
  }
  
  // Create an array of page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    
    // Logic to show limited page numbers with ellipsis for large page counts
    if (totalPages <= 7) {
      // Show all page numbers if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page, last page, and pages around current page
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push('ellipsis-start');
      }
      
      // Pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('ellipsis-end');
      }
      
      pages.push(totalPages);
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();
  
  return (
    <div className="pagination">
      {/* Previous page button */}
      <button 
        className="pagination-button prev"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="Go to previous page"
      >
        &laquo; Previous
      </button>
      
      {/* Page number buttons */}
      <div className="pagination-numbers">
        {pageNumbers.map((page, index) => {
          if (page === 'ellipsis-start' || page === 'ellipsis-end') {
            return <span key={`${page}-${index}`} className="pagination-ellipsis">&hellip;</span>;
          }
          
          return (
            <button
              key={`page-${page}`}
              className={`pagination-number ${currentPage === page ? 'active' : ''}`}
              onClick={() => onPageChange(page as number)}
              aria-label={`Go to page ${page}`}
              aria-current={currentPage === page ? 'page' : undefined}
            >
              {page}
            </button>
          );
        })}
      </div>
      
      {/* Next page button */}
      <button 
        className="pagination-button next"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="Go to next page"
      >
        Next &raquo;
      </button>
    </div>
  );
};

export default Pagination;
