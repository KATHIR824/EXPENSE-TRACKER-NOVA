package com.expensetracker.service;

import com.expensetracker.dto.SavingsDTO;
import com.expensetracker.entity.Savings;
import com.expensetracker.entity.User;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.repository.SavingsRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SavingsService {

    private final SavingsRepository savingsRepository;

    public SavingsService(SavingsRepository savingsRepository) {
        this.savingsRepository = savingsRepository;
    }

    public List<SavingsDTO> getAllSavings(User user) {
        return savingsRepository.findByUserAndIsActiveTrue(user)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public SavingsDTO getSavingsById(Long id, User user) {
        Savings savings = savingsRepository.findByIdAndUserAndIsActiveTrue(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Savings goal not found with id: " + id));
        return toDTO(savings);
    }

    @Transactional
    public SavingsDTO createSavings(SavingsDTO savingsDTO, User user) {
        Savings savings = Savings.builder()
                .goalName(savingsDTO.getGoalName())
                .description(savingsDTO.getDescription())
                .targetAmount(savingsDTO.getTargetAmount())
                .currentAmount(savingsDTO.getCurrentAmount() != null ? savingsDTO.getCurrentAmount() : java.math.BigDecimal.ZERO)
                .startDate(savingsDTO.getStartDate())
                .targetDate(savingsDTO.getTargetDate())
                .isCompleted(false)
                .isActive(true)
                .user(user)
                .build();

        savings = savingsRepository.save(savings);
        return toDTO(savings);
    }

    @Transactional
    public SavingsDTO updateSavings(Long id, SavingsDTO savingsDTO, User user) {
        Savings savings = savingsRepository.findByIdAndUserAndIsActiveTrue(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Savings goal not found with id: " + id));

        if (savingsDTO.getGoalName() != null) savings.setGoalName(savingsDTO.getGoalName());
        if (savingsDTO.getDescription() != null) savings.setDescription(savingsDTO.getDescription());
        if (savingsDTO.getTargetAmount() != null) savings.setTargetAmount(savingsDTO.getTargetAmount());
        if (savingsDTO.getCurrentAmount() != null) savings.setCurrentAmount(savingsDTO.getCurrentAmount());
        if (savingsDTO.getStartDate() != null) savings.setStartDate(savingsDTO.getStartDate());
        if (savingsDTO.getTargetDate() != null) savings.setTargetDate(savingsDTO.getTargetDate());
        savings.setCompleted(savingsDTO.isCompleted());

        savings = savingsRepository.save(savings);
        return toDTO(savings);
    }

    @Transactional
    public void deleteSavings(Long id, User user) {
        Savings savings = savingsRepository.findByIdAndUserAndIsActiveTrue(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Savings goal not found with id: " + id));
        savings.setActive(false);
        savingsRepository.save(savings);
    }

    private SavingsDTO toDTO(Savings savings) {
        return SavingsDTO.builder()
                .id(savings.getId())
                .goalName(savings.getGoalName())
                .description(savings.getDescription())
                .targetAmount(savings.getTargetAmount())
                .currentAmount(savings.getCurrentAmount())
                .startDate(savings.getStartDate())
                .targetDate(savings.getTargetDate())
                .isCompleted(savings.isCompleted())
                .isActive(savings.isActive())
                .createdAt(savings.getCreatedAt())
                .build();
    }
}