package com.expensetracker.service;

import com.expensetracker.dto.ImportResult;
import com.expensetracker.dto.IncomeDTO;
import com.expensetracker.entity.Income;
import com.expensetracker.entity.User;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.repository.IncomeRepository;
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
public class IncomeService {

    private final IncomeRepository incomeRepository;

    public IncomeService(IncomeRepository incomeRepository) {
        this.incomeRepository = incomeRepository;
    }

    public List<IncomeDTO> getAllIncomes(User user) {
        return incomeRepository.findByUserAndIsActiveTrueOrderByIncomeDateDesc(user)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public IncomeDTO getIncomeById(Long id, User user) {
        Income income = incomeRepository.findByIdAndUserAndIsActiveTrue(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Income not found with id: " + id));
        return toDTO(income);
    }

    @Transactional
    public IncomeDTO createIncome(IncomeDTO incomeDTO, User user) {
        Income income = Income.builder()
                .source(incomeDTO.getSource())
                .description(incomeDTO.getDescription())
                .amount(incomeDTO.getAmount())
                .incomeDate(incomeDTO.getIncomeDate() != null ? incomeDTO.getIncomeDate() : LocalDate.now())
                .isRecurring(incomeDTO.isRecurring())
                .recurringInterval(incomeDTO.getRecurringInterval())
                .incomeType(incomeDTO.getIncomeType())
                .user(user)
                .build();

        income = incomeRepository.save(income);
        return toDTO(income);
    }

    @Transactional
    public IncomeDTO updateIncome(Long id, IncomeDTO incomeDTO, User user) {
        Income income = incomeRepository.findByIdAndUserAndIsActiveTrue(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Income not found with id: " + id));

        if (incomeDTO.getSource() != null) income.setSource(incomeDTO.getSource());
        if (incomeDTO.getDescription() != null) income.setDescription(incomeDTO.getDescription());
        if (incomeDTO.getAmount() != null) income.setAmount(incomeDTO.getAmount());
        if (incomeDTO.getIncomeDate() != null) income.setIncomeDate(incomeDTO.getIncomeDate());
        income.setRecurring(incomeDTO.isRecurring());
        if (incomeDTO.getRecurringInterval() != null) income.setRecurringInterval(incomeDTO.getRecurringInterval());
        if (incomeDTO.getIncomeType() != null) income.setIncomeType(incomeDTO.getIncomeType());

        income = incomeRepository.save(income);
        return toDTO(income);
    }

    @Transactional
    public void deleteIncome(Long id, User user) {
        Income income = incomeRepository.findByIdAndUserAndIsActiveTrue(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Income not found with id: " + id));
        income.setActive(false);
        incomeRepository.save(income);
    }

    public List<IncomeDTO> getIncomesByDateRange(User user, LocalDate startDate, LocalDate endDate) {
        return incomeRepository.findByUserAndIncomeDateBetweenAndIsActiveTrue(user, startDate, endDate)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    // Import incomes from PDF (mirrors ExpenseService.importExpensesFromPdf).
    // Each line is expected to contain a date and an amount, e.g.:
    //   2026-06-01  Salary - June            4200.00
    //   01/06/2026  Freelance invoice #12    650.00
    @Transactional
    public ImportResult importIncomesFromPdf(MultipartFile file, User user) throws Exception {
        List<String> errors = new ArrayList<>();

        String text;
        try (InputStream is = file.getInputStream();
             PDDocument document = PDDocument.load(is)) {
            PDFTextStripper stripper = new PDFTextStripper();
            text = stripper.getText(document);
        }

        String[] lines = text.split("\\r?\\n");
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        DateTimeFormatter altDateFormatter1 = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        Pattern datePattern = Pattern.compile("\\d{4}-\\d{2}-\\d{2}");
        Pattern altDatePattern1 = Pattern.compile("\\d{2}/\\d{2}/\\d{4}");
        Pattern amountPattern = Pattern.compile("\\d+\\.\\d{2}");

        List<IncomeDTO> imported = new ArrayList<>();
        int lineNumber = 0;

        for (String line : lines) {
            lineNumber++;
            line = line.trim();
            if (line.isEmpty()) continue;

            LocalDate date = null;
            BigDecimal amount = null;
            String source = line;

            Matcher dateMatcher = datePattern.matcher(line);
            Matcher amountMatcher = amountPattern.matcher(line);

            if (dateMatcher.find() && amountMatcher.find()) {
                String dateStr = dateMatcher.group();
                String amountStr = amountMatcher.group();
                try {
                    date = LocalDate.parse(dateStr, dateFormatter);
                    amount = new BigDecimal(amountStr);
                    source = line.replace(dateStr, "").replace(amountStr, "").trim();
                    source = source.replaceAll("[|,]", "").trim();
                } catch (Exception e) {
                    // Fall through to alternative formats
                }
            }

            if (date == null || amount == null) {
                Matcher altDateMatcher = altDatePattern1.matcher(line);
                if (altDateMatcher.find() && amountMatcher.find()) {
                    String dateStr = altDateMatcher.group();
                    String amountStr = amountMatcher.group();
                    try {
                        date = LocalDate.parse(dateStr, altDateFormatter1);
                        amount = new BigDecimal(amountStr);
                        source = line.replace(dateStr, "").replace(amountStr, "").trim();
                        source = source.replaceAll("[|,]", "").trim();
                    } catch (Exception e) {
                        // Still failing
                    }
                }
            }

            if (amount == null) {
                Pattern currencyPattern = Pattern.compile("[\\$€£]\\s*(\\d+\\.\\d{2})|(\\d+\\.\\d{2})\\s*[\\$€£]");
                Matcher currencyMatcher = currencyPattern.matcher(line);
                if (currencyMatcher.find()) {
                    String amountStr = currencyMatcher.group(1) != null ? currencyMatcher.group(1) : currencyMatcher.group(2);
                    try {
                        amount = new BigDecimal(amountStr);
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
                        source = line.replaceAll("[\\$€£]", "").replaceAll("\\d+\\.\\d{2}", "").trim();
                        if (date != null) {
                            source = source.replace(date.toString(), "").trim();
                        }
                        source = source.replaceAll("[|,]", "").trim();
                    } catch (Exception e) {
                        // ignore
                    }
                }
            }

            if (date == null || amount == null) {
                errors.add("Line " + lineNumber + ": Could not parse date or amount: " + line);
                continue;
            }

            if (source.isEmpty()) {
                source = "Imported income";
            }
            if (source.length() > 100) {
                source = source.substring(0, 100);
            }

            imported.add(IncomeDTO.builder()
                    .source(source)
                    .description("Imported from PDF")
                    .amount(amount)
                    .incomeDate(date)
                    .build());
        }

        int success = 0;
        for (IncomeDTO dto : imported) {
            try {
                createIncome(dto, user);
                success++;
            } catch (Exception e) {
                errors.add("Failed to save income: " + e.getMessage());
            }
        }

        return ImportResult.builder()
                .total(imported.size())
                .success(success)
                .errors(errors)
                .build();
    }

    private IncomeDTO toDTO(Income income) {
        return IncomeDTO.builder()
                .id(income.getId())
                .source(income.getSource())
                .description(income.getDescription())
                .amount(income.getAmount())
                .incomeDate(income.getIncomeDate())
                .isRecurring(income.isRecurring())
                .recurringInterval(income.getRecurringInterval())
                .incomeType(income.getIncomeType())
                .createdAt(income.getCreatedAt())
                .build();
    }
}