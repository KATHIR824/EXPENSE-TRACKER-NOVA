package com.expensetracker.repository;

import com.expensetracker.entity.Category;
import com.expensetracker.entity.Expense;
import com.expensetracker.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    List<Expense> findByUserOrderByExpenseDateDesc(User user);

    List<Expense> findByUserAndCategoryOrderByExpenseDateDesc(User user, Category category);

    List<Expense> findByUserAndExpenseDateBetweenOrderByExpenseDateDesc(User user, LocalDate startDate, LocalDate endDate);

    List<Expense> findByUserAndExpenseDate(User user, LocalDate date);

    List<Expense> findByUserAndIsRecurringTrue(User user);

    List<Expense> findByUserAndCategoryAndExpenseDateBetweenOrderByExpenseDateDesc(
            User user, Category category, LocalDate startDate, LocalDate endDate);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.user = :user AND e.expenseDate BETWEEN :startDate AND :endDate")
    BigDecimal getTotalExpensesByUserAndDateRange(@Param("user") User user,
                                                   @Param("startDate") LocalDate startDate,
                                                   @Param("endDate") LocalDate endDate);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.user = :user AND e.category = :category AND e.expenseDate BETWEEN :startDate AND :endDate")
    BigDecimal getTotalExpensesByUserAndCategoryAndDateRange(@Param("user") User user,
                                                             @Param("category") Category category,
                                                             @Param("startDate") LocalDate startDate,
                                                             @Param("endDate") LocalDate endDate);

    @Query("SELECT e.category, COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.user = :user AND e.expenseDate BETWEEN :startDate AND :endDate GROUP BY e.category")
    List<Object[]> getExpenseSummaryByCategory(@Param("user") User user,
                                                @Param("startDate") LocalDate startDate,
                                                @Param("endDate") LocalDate endDate);

    List<Expense> findByUserAndIsActiveTrueOrderByExpenseDateDesc(User user);
    Optional<Expense> findByIdAndUserAndIsActiveTrue(Long id, User user);
    List<Expense> findByUserAndExpenseDateBetweenAndIsActiveTrue(User user, LocalDate startDate, LocalDate endDate);
    List<Expense> findByUserAndCategoryIdAndIsActiveTrue(User user, Long categoryId);
    long countByUser(User user);
}
