package com.expensetracker.service;

import com.expensetracker.dto.ExpenseDTO;
import com.expensetracker.dto.ImportResult;
import com.expensetracker.entity.Category;
import com.expensetracker.entity.Expense;
import com.expensetracker.entity.User;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.repository.CategoryRepository;
import com.expensetracker.repository.ExpenseRepository;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final CategoryRepository categoryRepository;

    public ExpenseService(ExpenseRepository expenseRepository, CategoryRepository categoryRepository) {
        this.expenseRepository = expenseRepository;
        this.categoryRepository = categoryRepository;
    }

    public List<ExpenseDTO> getAllExpenses(User user) {
        return expenseRepository.findByUserAndIsActiveTrueOrderByExpenseDateDesc(user)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public ExpenseDTO getExpenseById(Long id, User user) {
        Expense expense = expenseRepository.findByIdAndUserAndIsActiveTrue(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found with id: " + id));
        return toDTO(expense);
    }

    @Transactional
    public ExpenseDTO createExpense(ExpenseDTO expenseDTO, User user) {
        Category category = categoryRepository.findById(expenseDTO.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + expenseDTO.getCategoryId()));

        Expense expense = Expense.builder()
                .title(expenseDTO.getTitle())
                .description(expenseDTO.getDescription())
                .amount(expenseDTO.getAmount())
                .expenseDate(expenseDTO.getExpenseDate() != null ? expenseDTO.getExpenseDate() : LocalDate.now())
                .isRecurring(expenseDTO.isRecurring())
                .recurringInterval(expenseDTO.getRecurringInterval())
                .paymentMethod(expenseDTO.getPaymentMethod())
                .receiptImageUrl(expenseDTO.getReceiptImageUrl())
                .category(category)
                .user(user)
                .build();

        expense = expenseRepository.save(expense);
        return toDTO(expense);
    }

    @Transactional
    public ExpenseDTO updateExpense(Long id, ExpenseDTO expenseDTO, User user) {
        Expense expense = expenseRepository.findByIdAndUserAndIsActiveTrue(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found with id: " + id));

        Category category = null;
        if (expenseDTO.getCategoryId() != null) {
            category = categoryRepository.findById(expenseDTO.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + expenseDTO.getCategoryId()));
        }

        if (expenseDTO.getTitle() != null) expense.setTitle(expenseDTO.getTitle());
        if (expenseDTO.getDescription() != null) expense.setDescription(expenseDTO.getDescription());
        if (expenseDTO.getAmount() != null) expense.setAmount(expenseDTO.getAmount());
        if (expenseDTO.getExpenseDate() != null) expense.setExpenseDate(expenseDTO.getExpenseDate());
        expense.setRecurring(expenseDTO.isRecurring());
        if (expenseDTO.getRecurringInterval() != null) expense.setRecurringInterval(expenseDTO.getRecurringInterval());
        if (expenseDTO.getPaymentMethod() != null) expense.setPaymentMethod(expenseDTO.getPaymentMethod());
        if (expenseDTO.getReceiptImageUrl() != null) expense.setReceiptImageUrl(expenseDTO.getReceiptImageUrl());
        if (category != null) expense.setCategory(category);

        expense = expenseRepository.save(expense);
        return toDTO(expense);
    }

    @Transactional
    public void deleteExpense(Long id, User user) {
        Expense expense = expenseRepository.findByIdAndUserAndIsActiveTrue(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found with id: " + id));
        expense.setActive(false);
        expenseRepository.save(expense);
    }

    public List<ExpenseDTO> getExpensesByDateRange(User user, LocalDate startDate, LocalDate endDate) {
        return expenseRepository.findByUserAndExpenseDateBetweenAndIsActiveTrue(user, startDate, endDate)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<ExpenseDTO> getExpensesByCategory(User user, Long categoryId) {
        return expenseRepository.findByUserAndCategoryIdAndIsActiveTrue(user, categoryId)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    // ✅ NEW: Import expenses from PDF
    @Transactional
    public ImportResult importExpensesFromPdf(MultipartFile file, User user) throws Exception {
        // NOTE: ImportResult uses @Builder.Default for `errors`, and Lombok only
        // applies @Builder.Default initializers through the builder — the plain
        // no-args constructor leaves the field null. Allocating the list here
        // (instead of via `new ImportResult()` + getErrors()) avoids a
        // NullPointerException on the very first parse failure, which is what
        // was making PDF import fail for almost every real-world statement.
        List<String> errors = new ArrayList<>();

        // 1. Extract text from PDF
        String text;
        try (InputStream is = file.getInputStream();
             PDDocument document = PDDocument.load(is)) {
            PDFTextStripper stripper = new PDFTextStripper();
            text = stripper.getText(document);
        }

        // 2. Parse lines - assumes date format yyyy-MM-dd and amount like 12.34
        String[] lines = text.split("\\r?\\n");
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        Pattern datePattern = Pattern.compile("\\d{4}-\\d{2}-\\d{2}");
        Pattern amountPattern = Pattern.compile("\\d+\\.\\d{2}");

        // Try alternative date formats if needed (dd/MM/yyyy or MM/dd/yyyy)
        DateTimeFormatter altDateFormatter1 = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        DateTimeFormatter altDateFormatter2 = DateTimeFormatter.ofPattern("MM/dd/yyyy");
        Pattern altDatePattern1 = Pattern.compile("\\d{2}/\\d{2}/\\d{4}");

        List<ExpenseDTO> imported = new ArrayList<>();
        int lineNumber = 0;

        for (String line : lines) {
            lineNumber++;
            line = line.trim();
            if (line.isEmpty()) continue;

            LocalDate date = null;
            BigDecimal amount = null;
            String description = line;

            // Try primary date format: yyyy-MM-dd
            Matcher dateMatcher = datePattern.matcher(line);
            Matcher amountMatcher = amountPattern.matcher(line);

            if (dateMatcher.find() && amountMatcher.find()) {
                String dateStr = dateMatcher.group();
                String amountStr = amountMatcher.group();
                try {
                    date = LocalDate.parse(dateStr, dateFormatter);
                    amount = new BigDecimal(amountStr);
                    // Remove date and amount from description
                    description = line.replace(dateStr, "").replace(amountStr, "").trim();
                    description = description.replaceAll("[|,]", "").trim();
                } catch (Exception e) {
                    // Fall through to alternative formats
                }
            }

            // Try alternative date format: dd/MM/yyyy
            if (date == null || amount == null) {
                Matcher altDateMatcher = altDatePattern1.matcher(line);
                if (altDateMatcher.find() && amountMatcher.find()) {
                    String dateStr = altDateMatcher.group();
                    String amountStr = amountMatcher.group();
                    try {
                        date = LocalDate.parse(dateStr, altDateFormatter1);
                        amount = new BigDecimal(amountStr);
                        description = line.replace(dateStr, "").replace(amountStr, "").trim();
                        description = description.replaceAll("[|,]", "").trim();
                    } catch (Exception e) {
                        // Still failing
                    }
                }
            }

            // Try amount with currency symbol: $12.34 or 12.34$
            if (amount == null) {
                Pattern currencyPattern = Pattern.compile("[\\$€£]\\s*(\\d+\\.\\d{2})|(\\d+\\.\\d{2})\\s*[\\$€£]");
                Matcher currencyMatcher = currencyPattern.matcher(line);
                if (currencyMatcher.find()) {
                    String amountStr = currencyMatcher.group(1) != null ? currencyMatcher.group(1) : currencyMatcher.group(2);
                    try {
                        amount = new BigDecimal(amountStr);
                        // Need to re-extract date if not already set
                        if (date == null) {
                            Matcher dateMatcher2 = datePattern.matcher(line);
                            if (dateMatcher2.find()) {
                                date = LocalDate.parse(dateMatcher2.group(), dateFormatter);
                            } else {
                                Matcher altDateMatcher2 = altDatePattern1.matcher(line);
                                if (altDateMatcher2.find()) {
                                    date = LocalDate.parse(altDateMatcher2.group(), altDateFormatter1);
                                }
                            }
                        }
                        description = line.replaceAll("[\\$€£]", "").replaceAll("\\d+\\.\\d{2}", "").trim();
                        if (date != null) {
                            description = description.replace(date.toString(), "").trim();
                        }
                        description = description.replaceAll("[|,]", "").trim();
                    } catch (Exception e) {
                        // ignore
                    }
                }
            }

            if (date == null || amount == null) {
                errors.add("Line " + lineNumber + ": Could not parse date or amount: " + line);
                continue;
            }

            if (description.isEmpty()) {
                description = "Imported expense";
            }

            // Trim description to max 100 chars
            if (description.length() > 100) {
                description = description.substring(0, 100);
            }

            // Try to find a default category (Miscellaneous)
            Long categoryId = null;
            try {
                // Try to find a default category named "Miscellaneous" or any default category
                List<Category> defaultCategories = categoryRepository.findByIsDefaultTrue();
                if (!defaultCategories.isEmpty()) {
                    categoryId = defaultCategories.get(0).getId();
                } else {
                    // Try to find any category that belongs to the user or is default
                    List<Category> userCategories = categoryRepository.findByUserOrIsDefaultTrue(user);
                    if (!userCategories.isEmpty()) {
                        categoryId = userCategories.get(0).getId();
                    }
                }
            } catch (Exception e) {
                // If no category found, we'll set categoryId to null
            }

            ExpenseDTO dto = ExpenseDTO.builder()
                    .title(description)
                    .description("Imported from PDF")
                    .amount(amount)
                    .expenseDate(date)
                    .categoryId(categoryId)
                    .build();

            imported.add(dto);
        }

        // 3. Save each expense
        int success = 0;
        for (ExpenseDTO dto : imported) {
            try {
                if (dto.getCategoryId() == null) {
                    errors.add("Skipped expense '" + dto.getTitle() + "' - no category found. Please add a category and try again.");
                    continue;
                }
                createExpense(dto, user);
                success++;
            } catch (Exception e) {
                errors.add("Failed to save expense: " + e.getMessage());
            }
        }

        return ImportResult.builder()
                .total(imported.size())
                .success(success)
                .errors(errors)
                .build();
    }

    private ExpenseDTO toDTO(Expense expense) {
        return ExpenseDTO.builder()
                .id(expense.getId())
                .title(expense.getTitle())
                .description(expense.getDescription())
                .amount(expense.getAmount())
                .expenseDate(expense.getExpenseDate())
                .isRecurring(expense.isRecurring())
                .recurringInterval(expense.getRecurringInterval())
                .paymentMethod(expense.getPaymentMethod())
                .receiptImageUrl(expense.getReceiptImageUrl())
                .categoryId(expense.getCategory().getId())
                .categoryName(expense.getCategory().getName())
                .createdAt(expense.getCreatedAt())
                .build();
    }
}