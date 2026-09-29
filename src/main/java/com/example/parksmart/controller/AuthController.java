package com.example.parksmart.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.parksmart.dto.AdminCreateUserRequest;
import com.example.parksmart.dto.AdminUpdateUserRequest;
import com.example.parksmart.dto.AuthResponse;
import com.example.parksmart.dto.LoginRequest;
import com.example.parksmart.dto.RegisterRequest;
import com.example.parksmart.dto.UserResponse;
import com.example.parksmart.service.AuthService;

import jakarta.validation.Valid;

@RestController
@RequestMapping({"/api/auth", "/api"})
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * Public registration — always creates a CUSTOMER account.
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(authService.register(request));
    }

    /**
     * Public login — returns JWT on success.
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request) {

        return ResponseEntity.ok(authService.login(request));
    }

    // ─── Admin User Management ────────────────────────────────────────────────

    @GetMapping({"/admin/users", "/users"})
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(authService.getAllUsers());
    }

    @GetMapping({"/admin/users/{id}", "/users/{id}"})
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(authService.getUserById(id));
    }

    @PostMapping({"/admin/users", "/admin/create-user"})
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> createUser(
            @Valid @RequestBody AdminCreateUserRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(authService.createUser(request));
    }

    @PutMapping({"/admin/users/{id}", "/users/{id}"})
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody AdminUpdateUserRequest request) {

        return ResponseEntity.ok(authService.updateUser(id, request));
    }

    @PutMapping({"/admin/users/{id}/role", "/users/{id}/role"})
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> updateRole(
            @PathVariable Long id,
            @RequestParam String role) {

        return ResponseEntity.ok(authService.updateUserRole(id, role));
    }

    @PutMapping({"/admin/users/{id}/toggle", "/users/{id}/toggle"})
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> toggleEnabled(@PathVariable Long id) {
        return ResponseEntity.ok(authService.toggleUserEnabled(id));
    }

    @PatchMapping({"/admin/users/{id}/status", "/users/{id}/status"})
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> updateStatus(
            @PathVariable Long id,
            @RequestParam(required = false) Boolean enabled) {
        if (enabled != null) {
            AdminUpdateUserRequest req = new AdminUpdateUserRequest();
            req.setEnabled(enabled);
            return ResponseEntity.ok(authService.updateUser(id, req));
        }
        return ResponseEntity.ok(authService.toggleUserEnabled(id));
    }

    @DeleteMapping({"/admin/users/{id}", "/users/{id}"})
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        authService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
