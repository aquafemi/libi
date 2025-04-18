import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook to handle pagination logic
 * 
 * @param {Array} items - The array of items to paginate
 * @param {number} itemsPerPage - Number of items to show per page
 * @returns {Object} - Pagination state and functions
 */
export const usePagination = (items = [], itemsPerPage = 10) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [displayedItems, setDisplayedItems] = useState([]);
  const [isChangingPage, setIsChangingPage] = useState(false);
  const listRef = useRef(null);

  // Calculate total pages when items or itemsPerPage changes
  useEffect(() => {
    if (items.length > 0) {
      const pages = Math.ceil(items.length / itemsPerPage);
      setTotalPages(pages);
      
      // Reset to first page when data changes
      setCurrentPage(0);
      
      // Update displayed items
      setDisplayedItems(items.slice(0, itemsPerPage));
    } else {
      setTotalPages(0);
      setDisplayedItems([]);
    }
  }, [items, itemsPerPage]);

  // Handle page changes
  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setIsChangingPage(true);
      setCurrentPage(currentPage + 1);
      scrollToTop();
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setIsChangingPage(true);
      setCurrentPage(currentPage - 1);
      scrollToTop();
    }
  };
  
  // Helper to scroll to top of list
  const scrollToTop = () => {
    if (listRef.current) {
      listRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  };

  // Update displayed items when page changes
  useEffect(() => {
    if (items.length > 0) {
      const startIndex = currentPage * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      
      // Small artificial delay for better UX when changing pages
      const pagingDelay = setTimeout(() => {
        setDisplayedItems(items.slice(startIndex, endIndex));
        setIsChangingPage(false);
      }, 300);
      
      return () => clearTimeout(pagingDelay);
    }
  }, [currentPage, items, itemsPerPage]);

  return {
    currentPage,
    totalPages,
    displayedItems,
    isChangingPage,
    listRef,
    handleNextPage,
    handlePrevPage
  };
};

export default usePagination;