package com.expensetracker.service;

import com.expensetracker.dto.BudgetDTO;
import com.expensetracker.entity.Budget;
import com.expensetracker.entity.Category;
import com.expensetracker.entity.User;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.repository.BudgetRepository;
import com.expensetracker.repository.CategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final CategoryRepository categoryRepository;

    public BudgetService(BudgetRepository budgetRepository,
                         CategoryRepository categoryRepository) {
        this.budgetRepository = budgetRepository;
        this.categoryRepository = categoryRepository;
    }

    // ✅ All methods now accept User (the authenticated user) and filter by user

    @Transactional(readOnly = true)
    public List<BudgetDTO> getAllBudgets(User user) {
        return budgetRepository.findByUser(user).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BudgetDTO getBudgetById(Long id, User user) {
        Budget budget = budgetRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Budget not found with id: " + id + " for this user"));
        return convertToDTO(budget);
    }

    @Transactional
    public BudgetDTO createBudget(BudgetDTO budgetDTO, User user) {
        Category category = categoryRepository.findById(budgetDTO.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + budgetDTO.getCategoryId()));

        Budget budget = Budget.builder()
                .category(category)
                .amount(budgetDTO.getAmount())
                .startDate(budgetDTO.getStartDate())
                .endDate(budgetDTO.getEndDate())
                .isActive(budgetDTO.isActive())
                .user(user)   // ✅ Now setting the User object
                .build();

        Budget saved = budgetRepository.save(budget);
        return convertToDTO(saved);
    }

    @Transactional
    public BudgetDTO updateBudget(Long id, BudgetDTO budgetDTO, User user) {
        Budget budget = budgetRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Budget not found with id: " + id + " for this user"));

        if (budgetDTO.getAmount() != null) {
            budget.setAmount(budgetDTO.getAmount());
        }
        if (budgetDTO.getStartDate() != null) {
            budget.setStartDate(budgetDTO.getStartDate());
        }
        if (budgetDTO.getEndDate() != null) {
            budget.setEndDate(budgetDTO.getEndDate());
        }
        budget.setActive(budgetDTO.isActive());

        if (budgetDTO.getCategoryId() != null) {
            Category category = categoryRepository.findById(budgetDTO.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + budgetDTO.getCategoryId()));
            budget.setCategory(category);
        }

        Budget updated = budgetRepository.save(budget);
        return convertToDTO(updated);
    }

    @Transactional
    public void deleteBudget(Long id, User user) {
        Budget budget = budgetRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Budget not found with id: " + id + " for this user"));
        budgetRepository.delete(budget);
    }

    private BudgetDTO convertToDTO(Budget budget) {
        return BudgetDTO.builder()
                .id(budget.getId())
                .amount(budget.getAmount())
                .startDate(budget.getStartDate())
                .endDate(budget.getEndDate())
                .isActive(budget.isActive())
                .categoryId(budget.getCategory().getId())
                .categoryName(budget.getCategory().getName())
                .createdAt(budget.getCreatedAt())
                .build();
    }
}