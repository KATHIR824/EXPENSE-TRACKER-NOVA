package com.expensetracker.controller;

import com.expensetracker.dto.ApiResponse;
import com.expensetracker.dto.ExpenseDTO;
import com.expensetracker.dto.ImportResult;
import com.expensetracker.entity.User;
import com.expensetracker.service.ExpenseService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {

    private final ExpenseService expenseService;

    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ExpenseDTO>>> getAllExpenses(@AuthenticationPrincipal User user) {
        List<ExpenseDTO> expenses = expenseService.getAllExpenses(user);
        return ResponseEntity.ok(ApiResponse.success(expenses));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ExpenseDTO>> getExpenseById(@PathVariable Long id,
                                                                  @AuthenticationPrincipal User user) {
        ExpenseDTO expense = expenseService.getExpenseById(id, user);
        return ResponseEntity.ok(ApiResponse.success(expense));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ExpenseDTO>> createExpense(@Valid @RequestBody ExpenseDTO expenseDTO,
                                                                 @AuthenticationPrincipal User user) {
        ExpenseDTO created = expenseService.createExpense(expenseDTO, user);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Expense created successfully", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ExpenseDTO>> updateExpense(@PathVariable Long id,
                                                                 @Valid @RequestBody ExpenseDTO expenseDTO,
                                                                 @AuthenticationPrincipal User user) {
        ExpenseDTO updated = expenseService.updateExpense(id, expenseDTO, user);
        return ResponseEntity.ok(ApiResponse.success("Expense updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteExpense(@PathVariable Long id,
                                                           @AuthenticationPrincipal User user) {
        expenseService.deleteExpense(id, user);
        return ResponseEntity.ok(ApiResponse.success("Expense deleted successfully"));
    }

    // ✅ NEW: Import expenses from PDF
    @PostMapping("/import/pdf")
    public ResponseEntity<ApiResponse<ImportResult>> importExpensesFromPdf(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User user) {
        try {
            ImportResult result = expenseService.importExpensesFromPdf(file, user);
            return ResponseEntity.ok(ApiResponse.success("Import completed", result));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Import failed: " + e.getMessage()));
        }
    }
}