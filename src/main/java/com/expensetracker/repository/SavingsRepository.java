package com.expensetracker.repository;

import com.expensetracker.entity.Savings;
import com.expensetracker.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface SavingsRepository extends JpaRepository<Savings, Long> {

    List<Savings> findByUser(User user);

    List<Savings> findByUserAndIsActiveTrue(User user);
    Optional<Savings> findByIdAndUserAndIsActiveTrue(Long id, User user);

    List<Savings> findByUserAndIsCompletedTrue(User user);

    List<Savings> findByUserAndIsCompletedFalse(User user);

    @Query("SELECT COALESCE(SUM(s.currentAmount), 0) FROM Savings s WHERE s.user = :user AND s.isActive = true")
    BigDecimal getTotalSavedByUser(@Param("user") User user);

    @Query("SELECT COALESCE(SUM(s.targetAmount), 0) FROM Savings s WHERE s.user = :user AND s.isActive = true")
    BigDecimal getTotalTargetByUser(@Param("user") User user);

    long countByUser(User user);
}