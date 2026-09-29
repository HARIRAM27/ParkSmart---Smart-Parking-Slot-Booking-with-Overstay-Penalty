package com.example.parksmart.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.example.parksmart.Enums.Role;
import com.example.parksmart.model.User;
import com.example.parksmart.repo.UserRepo;

/**
 * Runs at application startup and creates a default ADMIN account
 * if no admin user exists in the database.
 *
 * Default credentials:
 *   username: admin
 *   password: Admin@1234
 *
 * Change these credentials immediately after first login.
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log =
            LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepo userRepo;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(
            UserRepo userRepo,
            PasswordEncoder passwordEncoder) {
        this.userRepo = userRepo;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {

        boolean adminExists = userRepo.findAll()
                .stream()
                .anyMatch(u -> u.getRole() == Role.ADMIN);

        if (!adminExists) {
            User admin = new User(
                    "admin",
                    "admin@parksmart.com",
                    passwordEncoder.encode("Admin@1234"),
                    Role.ADMIN
            );

            userRepo.save(admin);

            log.info("=========================================");
            log.info("Default ADMIN account created:");
            log.info("  Username : admin");
            log.info("  Password : Admin@1234");
            log.info("  CHANGE THIS PASSWORD IMMEDIATELY!");
            log.info("=========================================");
        }
    }
}
