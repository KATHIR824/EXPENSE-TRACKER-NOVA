package com.expensetracker.repository;

import com.expensetracker.entity.Income;
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
public interface IncomeRepository extends JpaRepository<Income, Long> {

    List<Income> findByUserOrderByIncomeDateDesc(User user);

    List<Income> findByUserAndIncomeDateBetweenOrderByIncomeDateDesc(User user, LocalDate startDate, LocalDate endDate);

    List<Income> findByUserAndIncomeDate(User user, LocalDate date);

    List<Income> findByUserAndIsRecurringTrue(User user);

    @Query("SELECT COALESCE(SUM(i.amount), 0) FROM Income i WHERE i.user = :user AND i.incomeDate BETWEEN :startDate AND :endDate")
    BigDecimal getTotalIncomeByUserAndDateRange(@Param("user") User user,
                                                 @Param("startDate") LocalDate startDate,
                                                 @Param("endDate") LocalDate endDate);

    List<Income> findByUserAndIsActiveTrueOrderByIncomeDateDesc(User user);
    Optional<Income> findByIdAndUserAndIsActiveTrue(Long id, User user);
    List<Income> findByUserAndIncomeDateBetweenAndIsActiveTrue(User user, LocalDate startDate, LocalDate endDate);
    long countByUser(User user);
}
