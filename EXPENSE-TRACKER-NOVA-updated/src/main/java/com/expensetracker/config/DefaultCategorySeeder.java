package com.expensetracker.config;

import com.expensetracker.entity.Category;
import com.expensetracker.repository.CategoryRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Seeds the predefined ("default") categories on every application startup,
 * regardless of active profile (H2, MySQL, Postgres) or spring.sql.init.mode.
 *
 * This replaces relying on data.sql, which only ran automatically on the
 * default/H2 profile (sql.init.mode: always). Here, seeding runs in plain
 * Java against JPA, so it works the same way in every environment.
 *
 * TO ADD, REMOVE, OR EDIT A PREDEFINED CATEGORY: just update the DEFAULTS
 * list below. Each entry is (name, description, icon, color). Existing
 * categories are matched by name and skipped, so this is safe to re-run and
 * safe to redeploy.
 */
@Component
public class DefaultCategorySeeder implements CommandLineRunner {

    private final CategoryRepository categoryRepository;

    public DefaultCategorySeeder(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    private static final List<Def> DEFAULTS = List.of(
            new Def("Groceries", "Supermarket and food supplies", "shopping-basket", "#0f6e5c"),
            new Def("Dining Out", "Restaurants, cafes, and takeout", "coffee", "#c99a44"),
            new Def("Transportation", "Gas, public transit, parking, and maintenance", "car", "#b3402f"),
            new Def("Shopping", "Clothing, electronics, and general purchases", "shopping-bag", "#1a8f5f"),
            new Def("Rent & Housing", "Rent, mortgage, and home repairs", "home", "#59645d"),
            new Def("Utilities", "Electricity, water, gas, internet, and phone", "zap", "#8b968f"),
            new Def("Healthcare", "Doctor visits, dental, and prescriptions", "heart-pulse", "#b3402f"),
            new Def("Entertainment", "Movies, concerts, streaming, and hobbies", "film", "#0f6e5c"),
            new Def("Education", "Tuition, books, and courses", "book-open", "#c99a44"),
            new Def("Insurance", "Health, auto, and life insurance premiums", "shield", "#1a8f5f"),
            new Def("Personal Care", "Grooming, gym, salons, and spa", "scissors", "#59645d"),
            new Def("Travel", "Flights, hotels, and vacations", "plane", "#b3402f"),
            new Def("Miscellaneous", "Other uncategorized expenses", "more-horizontal", "#8b968f")
            // Add new predefined categories here, e.g.:
            // new Def("Subscriptions", "Recurring digital subscriptions", "repeat", "#3a6ea5"),
    );

    @Override
    public void run(String... args) {
        for (Def def : DEFAULTS) {
            if (!categoryRepository.existsByNameAndUserIsNull(def.name)) {
                Category category = Category.builder()
                        .name(def.name)
                        .description(def.description)
                        .icon(def.icon)
                        .color(def.color)
                        .isDefault(true)
                        .isActive(true)
                        .build();
                categoryRepository.save(category);
            }
        }
    }

    private record Def(String name, String description, String icon, String color) {
    }
}
