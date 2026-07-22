package com.expensetracker.controller;

import com.expensetracker.dto.ApiResponse;
import com.expensetracker.dto.SavingsDTO;
import com.expensetracker.entity.User;
import com.expensetracker.service.SavingsService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/savings")
public class SavingsController {

    private final SavingsService savingsService;

    public SavingsController(SavingsService savingsService) {
        this.savingsService = savingsService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SavingsDTO>>> getAllSavings(@AuthenticationPrincipal User user) {
        List<SavingsDTO> savings = savingsService.getAllSavings(user);
        return ResponseEntity.ok(ApiResponse.success(savings));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SavingsDTO>> getSavingsById(@PathVariable Long id,
                                                                   @AuthenticationPrincipal User user) {
        SavingsDTO savings = savingsService.getSavingsById(id, user);
        return ResponseEntity.ok(ApiResponse.success(savings));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SavingsDTO>> createSavings(@Valid @RequestBody SavingsDTO savingsDTO,
                                                                  @AuthenticationPrincipal User user) {
        SavingsDTO created = savingsService.createSavings(savingsDTO, user);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Savings goal created successfully", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SavingsDTO>> updateSavings(@PathVariable Long id,
                                                                  @Valid @RequestBody SavingsDTO savingsDTO,
                                                                  @AuthenticationPrincipal User user) {
        SavingsDTO updated = savingsService.updateSavings(id, savingsDTO, user);
        return ResponseEntity.ok(ApiResponse.success("Savings goal updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSavings(@PathVariable Long id,
                                                           @AuthenticationPrincipal User user) {
        savingsService.deleteSavings(id, user);
        return ResponseEntity.ok(ApiResponse.success("Savings goal deleted successfully"));
    }
}