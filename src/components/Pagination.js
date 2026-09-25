'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './Pagination.module.scss';

export default function Pagination({ currentPage, totalPages, onPageChange, totalItems, pageSize = 10 }) {
  if (totalPages <= 1) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  // Build page numbers with ellipsis (show up to 5 pages)
  const getPages = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage < maxVisible - 1) startPage = Math.max(1, endPage - maxVisible + 1);
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    return { pages, startPage, endPage };
  };

  const { pages, startPage, endPage } = getPages();

  return (
    <div className={styles.wrapper}>
      <span className={styles.info}>
        Showing {start}–{end} of {totalItems}
      </span>
      <div className={styles.controls}>
        <button
          className={`${styles.pageBtn} ${styles.navBtn}`}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft size={16} /> Prev
        </button>

        {startPage > 1 && (
          <>
            <button className={styles.pageBtn} onClick={() => onPageChange(1)}>1</button>
            {startPage > 2 && <span className={styles.ellipsis}>…</span>}
          </>
        )}

        {pages.map(p => (
          <button
            key={p}
            className={`${styles.pageBtn} ${p === currentPage ? styles.active : ''}`}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className={styles.ellipsis}>…</span>}
            <button className={styles.pageBtn} onClick={() => onPageChange(totalPages)}>{totalPages}</button>
          </>
        )}

        <button
          className={`${styles.pageBtn} ${styles.navBtn}`}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
