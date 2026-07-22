package com.expensetracker.controller;

import com.expensetracker.dto.ApiResponse;
import com.expensetracker.dto.ImportResult;
import com.expensetracker.dto.IncomeDTO;
import com.expensetracker.entity.User;
import com.expensetracker.service.IncomeService;
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
@RequestMapping("/api/incomes")
public class IncomeController {

    private final IncomeService incomeService;

    public IncomeController(IncomeService incomeService) {
        this.incomeService = incomeService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<IncomeDTO>>> getAllIncomes(@AuthenticationPrincipal User user) {
        List<IncomeDTO> incomes = incomeService.getAllIncomes(user);
        return ResponseEntity.ok(ApiResponse.success(incomes));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<IncomeDTO>> getIncomeById(@PathVariable Long id,
                                                                 @AuthenticationPrincipal User user) {
        IncomeDTO income = incomeService.getIncomeById(id, user);
        return ResponseEntity.ok(ApiResponse.success(income));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<IncomeDTO>> createIncome(@Valid @RequestBody IncomeDTO incomeDTO,
                                                                @AuthenticationPrincipal User user) {
        IncomeDTO created = incomeService.createIncome(incomeDTO, user);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Income created successfully", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<IncomeDTO>> updateIncome(@PathVariable Long id,
                                                                @Valid @RequestBody IncomeDTO incomeDTO,
                                                                @AuthenticationPrincipal User user) {
        IncomeDTO updated = incomeService.updateIncome(id, incomeDTO, user);
        return ResponseEntity.ok(ApiResponse.success("Income updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteIncome(@PathVariable Long id,
                                                          @AuthenticationPrincipal User user) {
        incomeService.deleteIncome(id, user);
        return ResponseEntity.ok(ApiResponse.success("Income deleted successfully"));
    }

    // Import incomes from PDF
    @PostMapping("/import/pdf")
    public ResponseEntity<ApiResponse<ImportResult>> importIncomesFromPdf(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User user) {
        try {
            ImportResult result = incomeService.importIncomesFromPdf(file, user);
            return ResponseEntity.ok(ApiResponse.success("Import completed", result));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Import failed: " + e.getMessage()));
        }
    }
}